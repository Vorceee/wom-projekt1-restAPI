document.getElementById('signupForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log('username:', username, 'password:', password);

    try {
        const response = await fetch('http://localhost:3000/api/users/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: username,
                password: password
            })
        });

        const data = await response.json();
        
        if (response.status === 201) {
            alert('User created successfully');
            window.location.href = '/'; 
        } else {
            alert(data.message);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
});
