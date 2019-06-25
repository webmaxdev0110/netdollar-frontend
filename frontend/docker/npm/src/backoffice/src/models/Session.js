module.exports = {
    modalTitle:   m.prop(null),
    modalMessage: m.prop(null),
    modalSize:    m.prop(8),

    modal: function(msg, title, size) {
        this.modalMessage(msg);

        if (typeof title != 'undefined') {
            this.modalTitle(title);
        }

        if (typeof size == 'string') {
            switch (size) {
                case 'small':
                    this.modalSize(4);
                    break;
                case 'medium':
                    this.modalSize(8);
                    break;
                case 'big':
                    this.modalSize(10);
                    break;
                default:
                    this.modalSize(8);
            }
        }
    },

    closeModal: function(){
        this.modalMessage(null);
        this.modalTitle(null);
        this.modalSize(8);
    }
}