module.exports = {
    userStatus: {
        START_BOT: 'start_bot', // только что запустил бота
        NEW_ORDER: 'new_order', // создал новый заказ
        ENTER_ADDRESS: 'enter_address', // ожидает ввода адреса
        ENTER_FIRSTNAME: 'enter_firstname', // ожидает ввода имени
        ENTER_PHONE_NUMBER: 'enter_phone_number', // ожидает ввода номера телефона
        DONE_ORDER: 'done_order',
    },
    botCommands: {
        START: '/start',
        INFO: '/info',
        NEW_ORDER: '/new_order',
        ORDERS: '/orders',
        ENTER_FIRSTNAME: 'Ввести имя',
        ENTER_ADDRESS: 'Ввести адрес',
        ENTER_PHONE_NUMBER: 'Ввести телефон',
        CHECK_ORDER: 'Проверить заказ',
        COMPLETE_THE_ORDER : 'complete_the_order',
        CONTINUE_ORDER: 'continue_order'
    },
    messages: {
        START(firstname = 'Уважаемый клиент') {
            return (
                `Добро пожаловать, ${firstname}! Вас приветствует команда Супер Стирка.` +
                ' Здесь вы можете ознакомиться с нашими работами и сделать заказ.'
            )
        },
        ERROR: 'Произошла ошибка(\nПопробуйте повторить позже',
        INFO: '👨🏻‍🔬Меня зовут Илья, я занимаюсь:\n'+
        '♻️Чистка диванов, матрасов, ковров…\n'+
        '🌪Устранение пятен и запахов\n'+
        '🍊Гипоаллергенная безопасная химия\n'+
        '📩 По вопросам пишите в direct\n'+
        'inst: super.stirka\n'+
        '🇧🇾 Витебск',
        CHECK_ORDER(
            firstname,
            phone_number,
            address,
        ) {
            return ( 
                `Ваше имя: ${firstname}\n`+
                `Номер для связи: ${phone_number}\n`+
                `Ваш адрес: ${address}`
            )
        },
    }
}