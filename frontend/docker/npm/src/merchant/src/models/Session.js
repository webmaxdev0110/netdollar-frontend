module.exports = {
    modalTitle: m.prop(null),
    modalMessage: m.prop(null),

    modal: function(msg, title) {
        this.modalMessage(msg);

        if (typeof title != 'undefined') {
            this.modalTitle(title);
        }
    },

    closeModal: function() {
        this.modalMessage(null);
        this.modalTitle(null);
    }
}