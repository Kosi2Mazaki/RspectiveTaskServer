'use strict';
var mongoose = require('mongoose');
var Task = require('./task');
var common = require('./common');

/**
 * Function used to get all tasks from the database
 * @param  {object} req request passed to the controller
 * @param  {object} res response send by the server
 */
exports.list_all_tasks = function (req, res) {
    // SORT by created date and than by done to move done to bottom
    // Task.find({ owner: req.query.user, root: true })
    Task.find({})
        .sort({ 'done': '1', 'created_at': '1' }).exec(function (err, tasks) {
            if (err) {
                common.handleError("Some Internal error while listing tasks occurred", err);
            } else {
                res.send(tasks);
            }
        });
};

/**
 * Function used to get all tasks from the database
 * @param  {object} req request passed to the controller
 * @param  {object} res response send by the server
 */
exports.list_tasks_user = function (req, res) {
    Task.find({}, function (err, tasks) {
        if (err) {
            common.handleError("Some Internal error while listing tasks occurred", err);
        } else {
            console.log(tasks);
            res.send(tasks);
        }
    });
};


/**
 * Function used to get task from the database by its id
 * @param  {object} req request passed to the controller
 * @param  {object} res response send by the server
 */
exports.get_task = function (req, res) {
    Task.findById(req.query.id).
        populate('subtasks')
        .exec(function (err, task) {
            if (err) {
                common.handleError("Some Internal error while fetching a single task occurred", err);
            } else {
                res.send(task);
            }
        });
};

/**
 * Used to create single task without any subtasks - bes
 * @param  {object} req request passed to the controller
 * @param  {object} res response send by the server
 */
exports.create_task = function (req, res) {
    // append info about task
    let body = req.body
    body['root'] = true
    var newTask = new Task(body);

    newTask.save(function (err) {
        if (err) {
            common.handleError("Some Internal error while creating tasks occurred", err);
        } else {
            res.send(newTask);
        }
    });
};

/**
 * Used to create a subtask element. As the response, the updated
 * task is returned
 * @param  {object} req request passed to the controller
 * @param  {object} res response send by the server
 */
exports.create_subtask = function (req, res) {
    Task.findById(req.params.id, function (err, parent) {
        if (err) {
            common.handleError("Some Internal error while creating a sub-tasks occurred", err);
        }
        let body = req.body
        body['root'] = false
        var newTask = new Task(body);
        newTask.save(function (err) {
            if (err) {
                common.handleError("Some Internal error while creating tasks occurred", err);
            }
        });
        parent.subtasks.push(newTask);
        parent.save(function (err, updatedTask) {
            if (err) {
                common.handleError("Some Internal error while creating tasks occurred", err);
            } else {
                res.send(newTask);
            }
        });
    });
};

/**
 * Used to update a task element. As the response, the updated
 * task is returned
 * @param  {object} req request passed to the controller
 * @param  {object} res response send by the server
 */
exports.update_task = function (req, res) {
    console.log(req.params)
    console.log(req.body)
    Task.findById(req.params.id, function (err, element) {
        if (err) {
            common.handleError("Some Internal error while updating tasks occurred", err);
        }

        element.name = req.body.name
        element.description = req.body.description
        element.done = req.body.done

        element.save(function (err, updatedTask) {
            if (err) {
                common.handleError("Some Internal error while updating tasks occurred", err);
            } else {
                res.send(element);
            }
        })

    });
}

/**
 * Used to remove a root task from the database
 * @param  {object} req request passed to the controller
 * @param  {object} res response send by the server
 */
exports.remove_task = function (req, res) {
    Task.findByIdAndRemove(req.params.id, function (err, element) {
        if (err) {
            common.handleError("Some Internal error while removing a task occurred", err);
        }
    });

    // Update references
    Task.update(
        {},
        { $pull: { subtasks: req.params.id } },
        { multi: true },
        function (err) {
            if (err) {
                common.handleError("Some Internal error while removing a reference to the task occurred", err);
            }

        }
    );
    res.send("Done!");
};
