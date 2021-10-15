'use strict';


/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  complete: async (ctx) => {
    const taskId = parseInt(ctx.params.id);
    const userId = parseInt(ctx.state.user.id);
    
    const knex = strapi.connections.default;
    try {
      const checkTask = await knex('tasks')
        .where('id', taskId)
        .select('id as id')
        .select('name as name')
        .select('description as description')
        .select('xp as xp');

        if (!checkTask.length) {
          ctx.send( { error: `Task with id ${taskId} not found!`}, 404);
          return;
        }
    
        const result = await knex('completed_tasks').where('user_id', userId).where('task_id', taskId);

        if (result.length) {
          ctx.send( { error: 'You already completed this task!'}, 409);
          return;
        }

        await knex('completed_tasks').insert({user_id: userId, task_id: taskId});

        const finalResult = {...checkTask[0], completed: true}

        const user_data = (await knex('users-permissions_user').where('id', userId))[0];

        await knex('users-permissions_user').where('id', userId).update({
          xp: user_data.xp + checkTask[0].xp,
          completed_tasks: user_data.completed_tasks + 1,
        });

        ctx.send(finalResult, 200);

        
    } catch (e) {
      ctx.send( { error: e.message}, 500);
    }

    return;
  },

  findOne: async (ctx) => {
    const taskId = parseInt(ctx.params.id);
    const userId = parseInt(ctx.state.user.id);
    try {
      const knex = strapi.connections.default;
      const checkTask = await knex('tasks as t')
        .select('t.id as id')
        .select('t.name as name')
        .select('t.description as description')
        .select('t.xp as xp')
        .count('c.task_id as completed')
        .leftJoin('completed_tasks as c', 't.id', 'c.task_id')
        .where('id', taskId);

        if (!checkTask.length) {
          ctx.send( { error: `Task with id ${taskId} not found!`}, 404);
          return;
        }

        checkTask[0].completed = checkTask[0].completed ? true : false;
        ctx.send(checkTask[0], 200);
    } catch (e) {
      ctx.send( { error: e.message}, 500);
    }
  },

  find: async (ctx) => {
    const taskId = parseInt(ctx.params.id);
    const userId = parseInt(ctx.state.user.id);
    try {
      const knex = strapi.connections.default;
      const checkTask = await knex('tasks as t')
        .select('t.id as id')
        .select('t.name as name')
        .select('t.description as description')
        .select('t.xp as xp')
        .select('c.task_id as completed')
        .leftJoin('completed_tasks as c', 't.id', 'c.task_id')

        const finalResult = checkTask.map(x => x = {...x, completed: x.completed ? true : false});
        ctx.send(finalResult, 200);
    } catch (e) {
      ctx.send( { error: e.message}, 500);
    }
  }
};
