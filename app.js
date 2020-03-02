const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const { PORT, pool } = require('./config');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let userBeingEditedID;
let header = [
    {
        id: 'first',
        title: 'First',
        value: '',
        type: 'text'
    },
    {
        id: 'last',
        title: 'Last',
        value: '',
        type: 'text'
    },
    {
        id: 'email',
        title: 'Email',
        value: '',
        type: 'email'
    },
    {
        id: 'age',
        title: 'Age',
        value: '',
        type: 'number'
    }
];

app.post('/newUser', (req, res) => {
    const { first, last, email, age } = req.body;
    pool.query(`INSERT INTO users (first, last, email, age) values ($1, $2, $3, $4)`,
        [first, last, email, age], (err) => {
            if (err) throw err;
            res.redirect('/userListing');
        });
});
app.get('/', (req, res) => {
    res.render('homePage');
});
app.get('/createUser', (req, res) => {
    res.render('newUser', { inputs: header });
});
app.get('/userListing', (req, res) => {
    pool.query('SELECT * FROM users', (err, users) => {
        if (err) {
            console.log('the table wasnt found, now making it')
            res.redirect('/addInitialUsers');
        }
        else if (users.rows.length === 0) {
            console.log('there is a table, just no rows in it')
            res.redirect('/addInitialUsers');
        }
        else {
            res.render('userListing', { inputs: header, users: users.rows });
        }

    });
});
app.get('/edit/:id', (req, res) => {
    userBeingEditedID = req.params.id;
    let editHeader = JSON.parse(JSON.stringify(header));
    pool.query('SELECT * FROM users where id = $1', [req.params.id], (err, user) => {
        if (err) throw err;
        if (user.rows.length === 1) {
            for (let i = 0; i < editHeader.length; i++) {
                editHeader[i].value = user.rows[0][editHeader[i].id];
            }
            res.render('userEdit', { user: user, inputs: editHeader });
        }
        else {
            res.redirect('/userListing');
        }
    });
});
app.get('/remove/:id', (req, res) => {
    pool.query(`DELETE FROM users WHERE id = $1`, [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/userListing');
    });
});
app.post('/lookup', (req, res) => {
    //redirect to userlisting with users being filtered by first or last name
    let isFirstName = req.body.userProperty === 'First';
    let queryString = `SELECT * FROM users WHERE ` + req.body.userProperty.toLowerCase() + ` LIKE '%`
        + req.body.lookupField + "%'";
    pool.query(queryString,
        (err, users) => {
            if (err) throw err;
            res.render('userListing', { inputs: header, users: users.rows });
        });
});
app.post('/sort', (req, res) => {
    let colName = req.body.userProperty.toLowerCase();
    let isAscending = req.body.sortDirection === 'Ascending' ? 'asc' : 'desc';
    let queryString = `SELECT * FROM users ORDER BY ` + req.body.userProperty.toLowerCase() + ' ' + isAscending
    pool.query(queryString, (err, users) => {
        if (err) throw err;
        res.render('userListing', { inputs: header, users: users.rows });
    });
});
app.post('/updateUser', (req, res) => {
    let obj = {};
    for (let i = 0; i < header.length; i++) {
        obj[header[i].id] = req.body[header[i].id];
    }
    pool.query(`
    update users 
	set
		"first" = $1,
		"last" = $2,
		"email" = $3,
		"age" = $4
    where id = $5`,
        [obj.first, obj.last, obj.email, obj.age, userBeingEditedID], (err) => {
            res.redirect('/userListing');
            if (err) throw err;
        });
});

app.get('/addInitialUsers', (req, res) => {
    let newUsersQueryStr = `
    insert into users ("first", "last", "email", "age")
        values ('Alexandra', 'Smith', 'anemail@email.com', 18),
        ('Donna', 'Johnson', 'anemail@email.com', 18),
        ('Felicity', 'Williams', 'anemail@email.com', 18),
        ('Grace', 'Brown', 'anemail@email.com', 18),
        ('Jan', 'Davis', 'anemail@email.com', 18),
        ('Benjamin', 'Wilson', 'anemail@email.com', 18),
        ('Cameron', 'Lee', 'anemail@email.com', 18),
        ('Dylan', 'White', 'anemail@email.com', 18),
        ('Jacob', 'Clark', 'anemail@email.com', 18),
        ('Matt', 'Scott', 'anemail@email.com', 18);
    `;
    pool.query(newUsersQueryStr, (err) => {
            if (err) {
                console.log('making table');
                pool.query(`
                CREATE TABLE users (
                    id serial NOT NULL,
                    first varchar(50) NOT NULL,
                    last varchar(50) NOT NULL,
                    email varchar(50) NOT NULL,
                    age int NOT NULL
                );`
                    , (err) => {
                        console.log('here, table created')
                        if (err) throw err;
                        console.log('redirecting back to the same get so users can be added');
                        pool.query(newUsersQueryStr, (err) => {if (err) throw err});
                    }
                );
            }
        });
    console.log('redirecting back to userlisting now that table has been added with 10 users');
    res.redirect('/userListing');
});
app.get('/testing', (req, res) => {
    pool.query(`insert into users ("first", "last", "email", "age")
    values ('Alexandra', 'Smith', 'anemail@email.com', 18)`, (err) => {
        if (err) throw err;
        res.send('this hopefully works');
    })
});

app.listen(PORT, () => {
    console.log(`app server is listening on port: ${PORT}`);
});
