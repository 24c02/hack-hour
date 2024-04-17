import { app, prisma } from '../app.js';

import { Callbacks, Views, Actions } from '../views/goals.js';
import { Views as HackViews } from '../views/hackhour.js';

import { randomUUID } from 'node:crypto';
import { assertVal } from '../utils/lib.js';

app.action(Actions.SELECT, async ({ ack, body, client }) => {
    const userId: string = body.user.id;
    
    await prisma.user.update({
        where: {
            slackId: userId
        },
        data: {
            selectedGoal: (body as any).actions[0].selected_option.value
        }
    });
    
    await ack();
    await client.views.update({
        view_id: (body as any).view.id,
        view: await Views.goals(userId)
    });
});

app.action(Actions.CREATE, async ({ ack, body, client }) => {
    await ack();

    await client.views.push({
        trigger_id: (body as any).trigger_id,
        view: Views.createGoal()
    });    
});

app.action(Actions.DELETE, async ({ ack, body, client }) => {
    await ack();

    await client.views.push({
        trigger_id: (body as any).trigger_id,
        view: Views.deleteGoal()
    });        
});

app.view(Callbacks.CREATE, async ({ ack, body, client }) => {
    const userId = body.user.id;
    const goalName = body.view.state.values.goal.goalName.value;

    // Make sure the goal name is valid
    if (goalName == null || goalName == "" || goalName == undefined) {
        await ack({
            response_action: 'errors',
            errors: {
                goalName: 'Please enter a valid goal name.'
            }
        });
        return;
    }

    assertVal(goalName);

    await prisma.goals.create({
        data: {
            slackId: userId,
            goalId: randomUUID(),
            goalName: goalName,
            minutes: 0
        }
    });

    await ack();
});

app.view(Callbacks.DELETE, async ({ ack, body, client }) => {
    const goalId = body.view.private_metadata;

    const goals = await prisma.goals.findMany({
        where: {
            slackId: body.user.id
        }
    });

    if (goals.length == 1) {
        await ack({
            response_action: 'update',
            view: Views.error("You must have at least one goal.")
        });
        return;
    }

    // Ensure that the goal is not the default goal
    const userData = await prisma.user.findUnique({
        where: {
            slackId: body.user.id
        }
    });

    if (userData?.selectedGoal == goalId) {
        await ack({
            response_action: 'update',
            view: Views.error("You cannot delete your currently selected goal.")
        });
        return;
    }

    console.log(`🗑️  Deleting goal ${goalId}`);

    await prisma.goals.delete({
        where: {
            goalId: goalId
        }
    });

    await ack({
        response_action: 'clear'
    });
});

app.view(Callbacks.GOALS, async ({ ack, body }) => {
    await ack();

    if (body.view.root_view_id == undefined) {
        return;
    }

    await app.client.views.update({
        view_id: body.view.root_view_id,
        view: await HackViews.start(body.user.id)
    });
});