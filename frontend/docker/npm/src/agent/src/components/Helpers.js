module.exports = {
    getDateFromTimestamp: function (timestamp) {
        var d = new Date(timestamp * 1000);
        var year = d.getFullYear();
        var month = this.transformToTwoDigits(d.getMonth() + 1);
        var day = this.transformToTwoDigits(d.getDate());
        var hours = this.transformToTwoDigits(d.getHours());
        var minutes = this.transformToTwoDigits(d.getMinutes());
        var seconds = this.transformToTwoDigits(d.getSeconds());

        return [day, month, year].join('.') + " " + [hours, minutes, seconds].join(':');
    },

    transformToTwoDigits: function (number) {
        return number.toString().length < 2 ? '0' + number : number;
    },

    getTimeFromSeconds: function (sec) {
        var dt = new Date();
        dt.setTime(sec*1000);
        var minutes = dt.getMinutes();
        var seconds = dt.getSeconds();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return minutes + ":" + seconds;
    },
}