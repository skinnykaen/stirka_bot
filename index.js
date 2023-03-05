require('dotenv').config();
const TelegramApi = require('node-telegram-bot-api');
const { connectToDatabase } = require('./repository');
const {
    orderOptions,
    startOptions,
    sureOptions
} = require('./buttons');
const {
    userStatus,
    botCommands,
    messages
} = require('./constant');

const botToken = process.env.BOT_TOKEN
const bot = new TelegramApi(botToken, { polling: true })

const startBot = async (usersCollection, ordersCollection) => {
    bot.setMyCommands([
        { command: botCommands.START, description: 'Запустить бота' },
        { command: botCommands.INFO, description: 'О нас' },
        { command: botCommands.NEW_ORDER, description: 'Сделать новый заказ' }
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const { id, first_name, last_name, username } = msg.chat;
        let user;
        console.log(text)
        console.log(botCommands.ENTER_PHONE_NUMBER)
        try {
            switch (text) {
                case botCommands.START:
                    await usersCollection.updateOne(
                        { chat_id: id },
                        {
                            $setOnInsert: {
                                chat_id: id,
                                status: userStatus.START_BOT,
                                firstname: null,
                                number: null,
                                username: username,
                                address: null,
                            }
                        },
                        { upsert: true }
                    )
                    return await bot.sendMessage(
                        id,
                        messages.START(first_name),
                        startOptions,
                    );
                case botCommands.INFO:
                    await sendInfo(id)
                    break
                case botCommands.NEW_ORDER:
                    user = await usersCollection.findOne({
                        chat_id: id
                    });
                    // Если пользователя нет в базе, он должен запустить бота
                    if (!user)
                        return bot.sendMessage(
                            id,
                            'Чтобы сделать заказ, запустите бота',
                        );
                    usersCollection.updateOne(
                        { chat_id: id },
                        {
                            "$set": {
                                status: userStatus.NEW_ORDER
                            }
                        }
                    );
                    break;
                case botCommands.ENTER_ADDRESS:
                    user = await usersCollection.findOne({
                        chat_id: id
                    });
                    if (user.status === userStatus.NEW_ORDER)
                        usersCollection.updateOne(
                            { chat_id: id },
                            {
                                "$set": {
                                    status: userStatus.ENTER_ADDRESS
                                }
                            }
                        );
                    return await bot.sendMessage(
                        id,
                        'Введите адрес',
                    );
                case botCommands.ENTER_PHONE_NUMBER:
                    user = await usersCollection.findOne({
                        chat_id: id
                    });
                    if (user.status === userStatus.NEW_ORDER)
                        usersCollection.updateOne(
                            { chat_id: id },
                            {
                                "$set": {
                                    status: userStatus.ENTER_PHONE_NUMBER,
                                }
                            }
                        );
                    return await bot.sendMessage(
                        id,
                        'Введите номер для связи',
                    );
                case botCommands.ENTER_FIRSTNAME:
                    user = await usersCollection.findOne({
                        chat_id: id
                    });
                    if (user.status === userStatus.NEW_ORDER)
                        usersCollection.updateOne(
                            { chat_id: id },
                            {
                                "$set": {
                                    status: userStatus.ENTER_FIRSTNAME,
                                }
                            }
                        );
                    return await bot.sendMessage(
                        id,
                        'Введите имя',
                    );
                case botCommands.CHECK_ORDER:
                    user = await usersCollection.findOne({
                        chat_id: id
                    });
                    if (!user.address || !user.firstname) {
                        await bot.sendMessage(id, 'Пожалуйста, заполните необходимые данные.');
                        return
                    }
                    await bot.sendMessage(id,
                        messages.CHECK_ORDER(
                            user.firstname,
                            user.phone_number,
                            user.address,
                        ));

                    await bot.sendMessage(id, 'Заказ верен?', sureOptions);
                    return
            }
            user = await usersCollection.findOne({
                chat_id: id
            });
            console.log(user)
            switch (user.status) {
                case userStatus.START_BOT:
                    return await bot.sendMessage(
                        id,
                        messages.START(user.firstname),
                        startOptions,
                    );
                case userStatus.ENTER_ADDRESS:
                    await usersCollection.updateOne(
                        { chat_id: id },
                        {
                            "$set": {
                                address: text,
                                status: userStatus.NEW_ORDER
                            }
                        }
                    );
                    await bot.sendMessage(
                        id,
                        'Адрес сохранен.',
                    );
                    await checkDoneOrder(id, usersCollection)
                    break;
                case userStatus.ENTER_FIRSTNAME:
                    await usersCollection.updateOne(
                        { chat_id: id },
                        {
                            "$set": {
                                firstname: text,
                                status: userStatus.NEW_ORDER
                            }
                        }
                    );
                    await bot.sendMessage(
                        id,
                        'Имя сохранено.',
                    );
                    await checkDoneOrder(id, usersCollection)
                    break;
                case userStatus.ENTER_PHONE_NUMBER:
                    await usersCollection.updateOne(
                        { chat_id: id },
                        {
                            "$set": {
                                phone_number: text,
                                status: userStatus.NEW_ORDER
                            }
                        }
                    );
                    await bot.sendMessage(
                        id,
                        'Номер мобильного сохранен.',
                    );
                    await checkDoneOrder(id, usersCollection)
                    break;
                case userStatus.NEW_ORDER:
                    await checkDoneOrder(id, usersCollection)
            }
            return
        } catch (e) {
            console.error(e)
            return bot.sendMessage(id, messages.INFO);
        }
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const { id } = msg.message.chat;
        let user;
        if (data === 'about') {
            await sendInfo(id)
            return
        }

        if (data === userStatus.NEW_ORDER) {
            user = await usersCollection.findOne({
                chat_id: id
            });
            // Если пользователя нет в базе, он должен запустить бота
            if (!user)
                return bot.sendMessage(
                    id,
                    'Чтобы сделать заказ, запустите бота',
                );
            usersCollection.updateOne(
                { chat_id: id },
                {
                    "$set": {
                        status: userStatus.NEW_ORDER
                    }
                }
            );
            if (!user.firstname) {
                await usersCollection.updateOne(
                    { chat_id: id },
                    {
                        "$set": {
                            status: userStatus.ENTER_FIRSTNAME
                        }
                    }
                );
                return await bot.sendMessage(
                    id,
                    'Для оформление заказа, пожалуйста, введите ваше имя.',
                );
            }
            if (!user.phone_number) {
                await usersCollection.updateOne(
                    { chat_id: id },
                    {
                        "$set": {
                            status: userStatus.ENTER_PHONE_NUMBER
                        }
                    }
                );
                return await bot.sendMessage(
                    id,
                    'Для оформление заказа, пожалуйста, введите ваш номер мобильного телефона.',
                );
            }
            if (!user.address) {
                await usersCollection.updateOne(
                    { chat_id: id },
                    {
                        "$set": {
                            status: userStatus.ENTER_ADDRESS
                        }
                    }
                );
                return await bot.sendMessage(
                    id,
                    'Для оформление заказа, пожалуйста, введите ваш адрес.',
                );
            }
            return await bot.sendMessage(
                id,
                'Проверьте данные и завершите оформление заказа.',
                orderOptions
            );
        }

        if (data === botCommands.COMPLETE_THE_ORDER) {
            user = await usersCollection.findOne({
                chat_id: id
            });
            await ordersCollection.insertOne({
                chat_id: id,
                firstname: user.firstname,
                username: user.username,
                address: user.address,
                phone_number: user.phone_number,
                isCompleted: false,
                created_at: Date.now()
            });
            const [order] = await ordersCollection
                .find({ chat_id: id })
                .sort({ created_at: -1 })
                .limit(1).toArray(() => {})
            await bot.sendMessage(250616087, 'Новый заказ');
            await bot.sendMessage(250616087,
                `Пользователь: @${order.username}\n` +
                `Имя: ${order.firstname}\n` +
                `Адрес: ${order.address}\n` +
                `Номер телефона: ${order.phone_number}\n`
            );
            return await bot.sendMessage(id, 'Заказ успешно принят!', startOptions);
        }

        if (data === botCommands.CONTINUE_ORDER) {
            return await bot.sendMessage(
                id,
                'Оформление заказа',
                orderOptions
            );
        }
        return
    })

}

async function checkDoneOrder(id, usersCollection) {
    user = await usersCollection.findOne({
        chat_id: id
    });
    if (!user.firstname) {
        await usersCollection.updateOne(
            { chat_id: id },
            {
                "$set": {
                    status: userStatus.ENTER_FIRSTNAME
                }
            }
        );
        return await bot.sendMessage(
            id,
            'Для оформление заказа, пожалуйста, введите ваше имя.',
        );
    }
    if (!user.phone_number) {
        await usersCollection.updateOne(
            { chat_id: id },
            {
                "$set": {
                    status: userStatus.ENTER_PHONE_NUMBER
                }
            }
        );
        return await bot.sendMessage(
            id,
            'Для оформление заказа, пожалуйста, введите ваш номер мобильного телефона.',
        );
    }
    if (!user.address) {
        await usersCollection.updateOne(
            { chat_id: id },
            {
                "$set": {
                    status: userStatus.ENTER_ADDRESS
                }
            }
        );
        return await bot.sendMessage(
            id,
            'Для оформление заказа, пожалуйста, введите ваш адрес.',
        );
    }
    return await bot.sendMessage(
        id,
        'Проверьте данные и завершите оформление заказа.',
        orderOptions
    );
}

async function sendInfo(id) {
    await bot.sendMessage(
        id,
       'До'
    );
    await bot.sendPhoto(id, './images/before_1.jpg')
    await bot.sendMessage(
        id,
       'После'
    );
    await bot.sendPhoto(id, './images/after_1.jpg')
    await bot.sendMessage(
        id,
       'До'
    );
    await bot.sendPhoto(id, './images/before_2.jpg')
    await bot.sendMessage(
        id,
       'После'
    );
    await bot.sendPhoto(id, './images/after_2.jpg')
    await bot.sendMessage(
        id,
       'До'
    );
    await bot.sendPhoto(id, './images/before_3.jpg')
    await bot.sendMessage(
        id,
       'После'
    );
    await bot.sendPhoto(id, './images/after_3.jpg')

    return await bot.sendMessage(
        id,
        messages.INFO,
    );
}

(async () => {
    const db = await connectToDatabase();
    const usersCollection = await db.collection(process.env.DB_USERS_COLLECTION);
    const ordersCollection = await db.collection(process.env.DB_ORDERS_COLLECTION);
    startBot(usersCollection, ordersCollection);
})()
