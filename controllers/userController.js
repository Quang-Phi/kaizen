// Example data (in a real application, this would come from a database)
let users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Doe' }
];

exports.getAllUsers = (req, res) => {
    res.json(users);
};

exports.createUser = (req, res) => {
    const newUser = req.body;
    newUser.id = users.length + 1; // Simple ID assignment
    users.push(newUser);
    res.status(201).json(newUser);
};

exports.getUserById = (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found');
    }
};

exports.updateUser = (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        Object.assign(user, req.body); // Update user with new data
        res.json(user);
    } else {
        res.status(404).send('User not found');
    }
};

exports.deleteUser = (req, res) => {
    const index = users.findIndex(u => u.id === parseInt(req.params.id));
    if (index !== -1) {
        users.splice(index, 1);
        res.status(204).send();
    } else {
        res.status(404).send('User not found');
    }
};
