document.getElementById('exitBtn').addEventListener('click', exitBoard);
document.getElementById('createTicketBtn').addEventListener('click', createNewTicket);
const ticketContainer = document.getElementById('TicketContainer');
const boardId = new URLSearchParams(window.location.search).get('boardId');
const boardName = new URLSearchParams(window.location.search).get('boardName');
const token = localStorage.getItem('token');

let draggedElement = null;
let draggedTicket = null;
let offsetX = 0;
let offsetY = 0;
let tickets = [];

const socket = new WebSocket('ws://localhost:3000');

socket.onopen = function() {
    const joinMsg = {
        type: 'join',
        token: token,
        boardId: boardId
    };
    socket.send(JSON.stringify(joinMsg));
};

socket.onmessage = function(event) {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
        case 'init':
            msg.tickets.forEach(ticket => {
                createTicketElement(ticket);
            });
            break;
        case 'createTicket':
            createTicketElement(msg.ticket);
            break;
        case 'updateTicket':
            updateTicketElement(msg.ticket);
            break;
        case 'deleteTicket':
            deleteTicketElement(msg.ticketId);
            break;
        case 'moveTicket':
            moveTicketElement(msg.ticket);
            break;
    }
};

function exitBoard() {
    window.location.href = '/boards';
}

async function createNewTicket() {
    const ticketId = generateUniqueId();
    const ticket = {
        id: ticketId,
        content: '',
        position: { top: 50, left: 50 }
    };

    createTicketElement(ticket);

    const msg = {
        type: 'createTicket',
        ticket: ticket
    };
    socket.send(JSON.stringify(msg));

    await saveTicketToAPI(ticket);
}

function createTicketElement(ticket) {
    const ticketDiv = document.createElement('div');
    ticketDiv.classList.add('ticket');
    ticketDiv.dataset.ticketId = ticket.id;

    const textArea = document.createElement('textarea');
    textArea.value = ticket.content;
    textArea.addEventListener('input', () => {
        ticket.content = textArea.value;
        const msg = {
            type: 'updateTicket',
            ticket: ticket
        };
        socket.send(JSON.stringify(msg));
        saveTicketToAPI(ticket); 
    });
    ticketDiv.appendChild(textArea);

    const removeButton = document.createElement('button');
    removeButton.innerHTML = 'x';
    removeButton.addEventListener('click', async () => {
        ticketContainer.removeChild(ticketDiv);
        const msg = {
            type: 'deleteTicket',
            ticketId: ticket.id
        };
        socket.send(JSON.stringify(msg));

        await deleteTicketFromAPI(ticket.id);
    });
    ticketDiv.appendChild(removeButton);

    ticketDiv.style.top = `${ticket.position.top}px`;
    ticketDiv.style.left = `${ticket.position.left}px`;

    ticketDiv.addEventListener('mousedown', (event) => startDragging(event, ticketDiv, ticket));
    document.addEventListener('mouseup', stopDragging);

    ticketContainer.appendChild(ticketDiv);
}

function startDragging(e, ticketDiv, ticket) {
    if (e.target.tagName === 'TEXTAREA') return;

    draggedElement = ticketDiv;
    draggedTicket = ticket;
    draggedElement.classList.add('dragging');

    const ticketRect = ticketDiv.getBoundingClientRect();
    offsetX = e.clientX - ticketRect.left;
    offsetY = e.clientY - ticketRect.top;

    document.addEventListener('mousemove', dragElement);
}

function dragElement(e) {
    if (!draggedElement) return;

    const containerRect = ticketContainer.getBoundingClientRect();
    let newX = e.clientX - containerRect.left - offsetX;
    let newY = e.clientY - containerRect.top - offsetY;

    newX = Math.max(0, Math.min(newX, containerRect.width - draggedElement.offsetWidth));
    newY = Math.max(0, Math.min(newY, containerRect.height - draggedElement.offsetHeight));

    draggedElement.style.left = `${newX}px`;
    draggedElement.style.top = `${newY}px`;

    draggedTicket.position.top = newY;
    draggedTicket.position.left = newX;

    const msg = {
        type: 'moveTicket',
        ticket: draggedTicket
    };
    socket.send(JSON.stringify(msg));
}

function stopDragging() {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        draggedTicket = null;
    }
    document.removeEventListener('mousemove', dragElement);
}

function updateTicketElement(ticket) {
    const ticketDiv = document.querySelector(`.ticket[data-ticket-id='${ticket.id}']`);
    if (ticketDiv) {
        const textArea = ticketDiv.querySelector('textarea');
        textArea.value = ticket.content;
    }
}

function deleteTicketElement(ticketId) {
    const ticketDiv = document.querySelector(`.ticket[data-ticket-id='${ticketId}']`);
    if (ticketDiv) {
        ticketContainer.removeChild(ticketDiv);
    }
}

function moveTicketElement(ticket) {
    const ticketDiv = document.querySelector(`.ticket[data-ticket-id='${ticket.id}']`);
    if (ticketDiv) {
        ticketDiv.style.top = `${ticket.position.top}px`;
        ticketDiv.style.left = `${ticket.position.left}px`;
    }
}

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

async function fetchAllTicketsFromAPI() {
    try {
        const response = await fetch(`http://localhost:3000/api/boards/${boardId}/tickets`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const tickets = await response.json();
            tickets.forEach(ticket => createTicketElement(ticket));
        } else {
            console.error('Failed to fetch tickets:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching tickets from API:', error);
    }
}

async function saveTicketToAPI() {
    try {
        for (const ticket of tickets) {
            const response = await fetch(`http://localhost:3000/api/boards/tickets/${ticket.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticket)
            });

            if (!response.ok) {
                console.error(`Error saving ticket ${ticket.id}:`, await response.text());
            }
        }
        console.log('All tickets saved successfully!');
    } catch (error) {
        console.error('Error saving tickets:', error);
    }
}

document.getElementById('saveAllBtn').addEventListener('click', saveTicketToAPI);

setInterval(() => {
    saveTicketToAPI();
}, 60000);

async function deleteTicketFromAPI(ticketId) {
    try {
        const response = await fetch(`http://localhost:3000/api/boards/tickets/${ticketId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            console.error('Error deleting ticket from API');
        }
    } catch (error) {
        console.error('Error deleting ticket:', error);
    }
}

window.onload = function() {
    document.getElementById('title').innerText = boardName;
    fetchAllTicketsFromAPI(); 
};
