const express = require('express');
const app = express();

require('dotenv').config();

const { mongoose } = require('./db/mongoose');

const bodyParser = require('body-parser');

// Load in the mongoose models
const { List, Task, User } = require('./db/models');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


// Mailtrap SMTP email helper
const sendResetEmail = async (toEmail, resetToken) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
        port: Number(process.env.MAILTRAP_PORT || 2525),
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS
        }
    });

    const fromEmail = process.env.MAIL_FROM || 'noreply@taskmanager.com';
    const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/forgot-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;

    await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: 'Password Reset Request',
        text: `You requested a password reset.\n\nYour reset code: ${resetToken}\n\nOr click this link: ${resetLink}\n\nThis code expires in 15 minutes.`,
        html: `<h2>Password Reset</h2><p>Your reset code:</p><h3>${resetToken}</h3><p>Or <a href="${resetLink}">click here to reset your password</a></p><p>This code expires in 15 minutes.</p>`
    });
}


/* MIDDLEWARE  */

// Load middleware
app.use(bodyParser.json());

// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});


// check whether the request has a valid JWT access token
let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // verify the JWT
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            // there was an error
            // jwt is invalid - * DO NOT AUTHENTICATE *
            res.status(401).send(err);
        } else {
            // jwt is valid
            req.user_id = decoded._id;
            next();
        }
    });
}

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // the session is VALID - call next() to continue with processing this web request
            next();
        } else {
            // the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

/* END MIDDLEWARE  */

// Role-check middleware
let authorizeRole = (...roles) => {
    return (req, res, next) => {
        User.findById(req.user_id).then((user) => {
            if (!user || !roles.includes(user.role)) {
                return res.status(403).send({ message: 'Access denied' });
            }
            req.userRole = user.role;
            next();
        }).catch(() => {
            res.status(403).send({ message: 'Access denied' });
        });
    };
}


/* ROUTE HANDLERS */

/* LIST ROUTES */

/**
 * GET /lists
 * Purpose: Get all lists
 */
app.get('/lists', authenticate, (req, res) => {

    // Return only the logged-in user's private (non-shared) lists
    List.find({
        _userId: req.user_id,
        isShared: { $ne: true }
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

/**
 * POST /lists
 * Purpose: Create a list
 */
app.post('/lists', authenticate, (req, res) => {
    let title = req.body.title;

    let newList = new List({
        title,
        _userId: req.user_id,
        isShared: false,
        createdAt: new Date()
    });
    newList.save().then((listDoc) => {
        res.send(listDoc);
    });
});

/**
 * PATCH /lists/:id
 * Purpose: Update a specified list
 */
app.patch('/lists/:id', authenticate, (req, res) => {
    const updateData = { ...req.body, updatedAt: new Date() };
    List.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
        $set: updateData
    }).then(() => {
        res.send({ 'message': 'updated successfully'});
    });
});

/**
 * DELETE /lists/:id
 * Purpose: Delete a list
 */
app.delete('/lists/:id', authenticate, (req, res) => {
    // We want to delete the specified list (document with id in the URL)
    List.findOneAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) => {
        res.send(removedListDoc);

        // delete all the tasks that are in the deleted list
        deleteTasksFromList(removedListDoc._id);
    })
});


/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks in a specific list
 */
app.get('/lists/:listId/tasks', authenticate, (req, res) => {
    // We want to return all tasks that belong to a specific list (specified by listId)
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks);
    })
});

app.get('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task) => {
        res.send(task);
    }).catch((e) => {
        res.status(404).send(e);
    });
});



/**
 * POST /lists/:listId/tasks
 * Purpose: Create a new task in a specific list
 */
app.post('/lists/:listId/tasks', authenticate, (req, res) => {

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            return true;
        }
        return false;
    }).then((canCreateTask) => {
        if (canCreateTask) {
            let newTask = new Task({
                title: req.body.title,
                amount: req.body.amount,
                _listId: req.params.listId,
                isShared: false,
                createdAt: new Date()
            });
            newTask.save().then((newTaskDoc) => {
                res.send(newTaskDoc);
            });
        } else {
            res.sendStatus(404);
        }
    })
})

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update an existing task
 */
app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            return true;
        }
        return false;
    }).then((canUpdateTasks) => {
        if (canUpdateTasks) {
            const updateData = { ...req.body, updatedAt: new Date() };
            Task.findOneAndUpdate({
                _id: req.params.taskId,
                _listId: req.params.listId
            }, {
                    $set: updateData
                },
                { runValidators: false }
            ).then(() => {
                res.send({ message: 'Updated successfully.' })
            });
        } else {
            res.sendStatus(404);
        }
    })
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a task
 */
app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // list object with the specified conditions was found
            // therefore the currently authenticated user can make updates to tasks within this list
            return true;
        }

        // else - the list object is undefined
        return false;
    }).then((canDeleteTasks) => {
        
        if (canDeleteTasks) {
            Task.findOneAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removedTaskDoc) => {
                res.send(removedTaskDoc);
            })
        } else {
            res.sendStatus(404);
        }
    });
});



/* USER ROUTES */

/**
 * POST /users
 * Purpose: Sign up
 */
app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we geneate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})


/**
 * POST /users/login
 * Purpose: Login
 */
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {

        if (user.isActive === false) {
            return Promise.reject({ message: 'Your account has been deactivated. Please contact the administrator.' });
        }

        return user.createSession().then((refreshToken) => {
            // Session created successfully - refreshToken returned.
            // now we geneate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                // access auth token generated successfully, now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        const message = e && e.message ? e.message : 'Invalid email or password';
        res.status(400).send({ message });
    });
})

/**
 * POST /users/forgot-password
 * Purpose: Send a password reset email with a token
 */
app.post('/users/forgot-password', (req, res) => {
    let email = req.body.email;

    if (!email) {
        return res.status(400).send({ message: 'Email is required' });
    }

    User.findOne({ email }).then((user) => {
        if (!user) {
            return res.send({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        return user.generatePasswordResetToken().then(async (resetToken) => {
            try {
                await sendResetEmail(email, resetToken);
                return res.send({ message: 'If an account with that email exists, a reset link has been sent.' });
            } catch (err) {
                console.error('Email send error:', err.message);
                return res.status(500).send({ message: 'Failed to send reset email. Please try again later.' });
            }
        });
    }).catch((e) => {
        res.status(400).send({ message: 'Something went wrong. Please try again.' });
    });
})

/**
 * POST /users/reset-password
 * Purpose: Reset password using the emailed token
 */
app.post('/users/reset-password', (req, res) => {
    let email = req.body.email;
    let resetToken = req.body.resetToken;
    let newPassword = req.body.newPassword;

    if (!email || !resetToken || !newPassword) {
        return res.status(400).send({ message: 'Email, reset token, and new password are required' });
    }

    User.findByPasswordResetCredentials(email, resetToken).then((user) => {
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpiresAt = null;
        return user.save();
    }).then(() => {
        res.send({ message: 'Password reset successful. Please login with your new password.' });
    }).catch(() => {
        res.status(400).send({ message: 'Invalid or expired reset token.' });
    });
})


/**
 * GET /users/me/access-token
 * Purpose: generates and returns an access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
    // we know that the user/caller is authenticated and we have the user_id and user object available to us
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})



/* HELPER METHODS */

/* SHARED BOARD ROUTES (manager/admin only) */

/**
 * GET /shared/lists
 * Purpose: Get all shared lists (visible to all authenticated users)
 */
app.get('/shared/lists', authenticate, (req, res) => {
    List.find({ isShared: true }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

/**
 * POST /shared/lists
 * Purpose: Create a shared list (manager/admin only)
 */
app.post('/shared/lists', authenticate, authorizeRole('manager', 'admin'), (req, res) => {
    User.findById(req.user_id).then((user) => {
        let newList = new List({
            title: req.body.title,
            _userId: req.user_id,
            isShared: true,
            createdBy: user.username || user.email,
            createdAt: new Date()
        });
        newList.save().then((listDoc) => {
            res.send(listDoc);
        });
    });
})

/**
 * PATCH /shared/lists/:id
 */
app.patch('/shared/lists/:id', authenticate, authorizeRole('manager', 'admin'), (req, res) => {
    User.findById(req.user_id).then((user) => {
        const updateData = { ...req.body, updatedBy: user.username || user.email, updatedAt: new Date() };
        List.findOneAndUpdate({ _id: req.params.id, isShared: true }, {
            $set: updateData
        }).then(() => {
            res.send({ message: 'updated successfully' });
        });
    });
})

/**
 * DELETE /shared/lists/:id
 */
app.delete('/shared/lists/:id', authenticate, authorizeRole('manager', 'admin'), (req, res) => {
    List.findOneAndRemove({
        _id: req.params.id,
        isShared: true
    }).then((removedListDoc) => {
        res.send(removedListDoc);
        deleteTasksFromList(removedListDoc._id);
    });
})

/**
 * GET /shared/lists/:listId/tasks
 */
app.get('/shared/lists/:listId/tasks', authenticate, (req, res) => {
    Task.find({ _listId: req.params.listId }).then((tasks) => {
        res.send(tasks);
    });
})

/**
 * POST /shared/lists/:listId/tasks
 */
app.post('/shared/lists/:listId/tasks', authenticate, authorizeRole('manager', 'admin'), (req, res) => {
    User.findById(req.user_id).then((user) => {
        let newTask = new Task({
            title: req.body.title,
            amount: req.body.amount,
            _listId: req.params.listId,
            isShared: true,
            createdBy: user.username || user.email,
            createdAt: new Date()
        });
        newTask.save().then((newTaskDoc) => {
            res.send(newTaskDoc);
        });
    });
})

/**
 * PATCH /shared/lists/:listId/tasks/:taskId
 */
app.patch('/shared/lists/:listId/tasks/:taskId', authenticate, authorizeRole('manager', 'admin'), (req, res) => {
    User.findById(req.user_id).then((user) => {
        const updateData = { ...req.body, updatedBy: user.username || user.email, updatedAt: new Date() };
        Task.findOneAndUpdate({
            _id: req.params.taskId,
            _listId: req.params.listId
        }, { $set: updateData }, { runValidators: false }).then(() => {
            res.send({ message: 'Updated successfully.' });
        });
    });
})

/**
 * DELETE /shared/lists/:listId/tasks/:taskId
 */
app.delete('/shared/lists/:listId/tasks/:taskId', authenticate, authorizeRole('manager', 'admin'), (req, res) => {
    Task.findOneAndRemove({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((removedTaskDoc) => {
        res.send(removedTaskDoc);
    });
})


/* ADMIN ROUTES (admin only) */

/**
 * GET /admin/users
 * Purpose: Get all users with their roles
 */
app.get('/admin/users', authenticate, authorizeRole('admin'), (req, res) => {
    User.find({}).then((users) => {
        res.send(users);
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/**
 * PATCH /admin/users/:userId/role
 * Purpose: Update a user's role
 */
app.patch('/admin/users/:userId/role', authenticate, authorizeRole('admin'), (req, res) => {
    const newRole = req.body.role;
    if (!['member', 'manager', 'admin'].includes(newRole)) {
        return res.status(400).send({ message: 'Invalid role. Must be member, manager, or admin.' });
    }

    User.findByIdAndUpdate(req.params.userId, { role: newRole }, { new: true }).then((user) => {
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/**
 * PATCH /admin/users/:userId/status
 * Purpose: Toggle a user's active/inactive status
 */
app.patch('/admin/users/:userId/status', authenticate, authorizeRole('admin'), (req, res) => {
    const isActive = req.body.isActive;
    if (typeof isActive !== 'boolean') {
        return res.status(400).send({ message: 'isActive must be true or false.' });
    }

    User.findByIdAndUpdate(req.params.userId, { isActive }, { new: true }).then((user) => {
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/**
 * GET /users/me
 * Purpose: Get current user's profile including role
 */
app.get('/users/me', authenticate, (req, res) => {
    User.findById(req.user_id).then((user) => {
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
})


let deleteTasksFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() => {
        console.log("Tasks from " + _listId + " were deleted!");
    })
}





const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server is listening on port " + PORT);
})