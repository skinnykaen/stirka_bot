module.exports = {
    startOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    { text: 'Сделать заказ', callback_data: 'new_order' },
                    { text: 'О нас', callback_data: 'about' }
                ]
            ]
        })
    },

    orderOptions: {
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    { text: 'Ввести имя'},
                    { text: 'Ввести телефон'},
                    { text: 'Ввести адрес' },
                    { text: 'Проверить заказ'},
                    // { text: 'Отмена'}
                ]
            ]
        })
    },

    sureOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    { text: 'Да, завершить', callback_data: 'complete_the_order' },
                    { text: 'Назад к оформлению', callback_data: 'continue_order' },
                ]
            ]
        })
    },
}