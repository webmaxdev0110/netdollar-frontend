var Conf = require('../config/Config');

var Helpers = {

    round: function(value, precision) {
        value = parseFloat(value);

        if (!isFinite(value)) {
            return value;
        }
        if (!precision){
            return Math.round(value);
        }
        var parts = value.toString().split('.');
        if (typeof parts[1] == 'undefined' || parts[1] <= 0 || parts[1].length <= precision) {
            return value;
        }
        if (parts[1].length > precision + 1) {
            parts[1] = parts[1].slice(0, ((parts[1].length - precision - 1)) * -1);
        }
        var correct = Math.pow(10, (parts[1].length + 1) * -1);
        var divider = Math.pow(10, parts[1].length - 1);

        return Math.round(((parts[0] + '.' + parts[1])*1 + correct) * divider) / divider;
    },

    buildPaymentsChart: function (array) {

        var handle_array = _.clone(array).reverse();
        var series = [handle_array];
        //smil-animations Chart
        var chart = new Chartist.Line('#smil-left-animations', {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
                '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25'],
            series: series/*[
             [12, 9, 7, 8, 5, 4, 6, 2, 3, 3, 4, 6],
             [4,  5, 3, 7, 3, 5, 5, 3, 4, 4, 5, 5],
             [5,  3, 4, 5, 6, 3, 3, 4, 5, 6, 3, 4],
             [3,  4, 5, 6, 7, 6, 4, 5, 6, 7, 6, 3]
             ]*/
        }, {
            low: 0
        });


        // Let's put a sequence number aside so we can use it in the event callbacks
        var seq = 0,
            delays = 20,
            durations = 125;

        // Once the chart is fully created we reset the sequence
        chart.on('created', function() {
            seq = 0;
        });

        // On each drawn element by Chartist we use the Chartist.Svg API to trigger SMIL animations
        chart.on('draw', function(data) {
            seq++;

            if(data.type === 'line') {
                // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
                data.element.animate({
                    opacity: {
                        // The delay when we like to start the animation
                        begin: seq * delays + 200,
                        // Duration of the animation
                        dur: durations,
                        // The value where the animation should start
                        from: 0,
                        // The value where it should end
                        to: 1
                    }
                });
            } else if(data.type === 'label' && data.axis === 'x') {
                data.element.animate({
                    y: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.y + 100,
                        to: data.y,
                        // We can specify an easing function from Chartist.Svg.Easing
                        easing: 'easeOutQuart'
                    }
                });
            } else if(data.type === 'label' && data.axis === 'y') {
                data.element.animate({
                    x: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.x - 100,
                        to: data.x,
                        easing: 'easeOutQuart'
                    }
                });
            } else if(data.type === 'point') {
                data.element.animate({
                    x1: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.x - 10,
                        to: data.x,
                        easing: 'easeOutQuart'
                    },
                    x2: {
                        begin: seq * delays,
                        dur: durations,
                        from: data.x - 10,
                        to: data.x,
                        easing: 'easeOutQuart'
                    },
                    opacity: {
                        begin: seq * delays,
                        dur: durations,
                        from: 0,
                        to: 1,
                        easing: 'easeOutQuart'
                    }
                });
            } else if(data.type === 'grid') {
                // Using data.axis we get x or y which we can use to construct our animation definition objects
                var pos1Animation = {
                    begin: seq * delays,
                    dur: durations,
                    from: data[data.axis.units.pos + '1'] - 30,
                    to: data[data.axis.units.pos + '1'],
                    easing: 'easeOutQuart'
                };

                var pos2Animation = {
                    begin: seq * delays,
                    dur: durations,
                    from: data[data.axis.units.pos + '2'] - 100,
                    to: data[data.axis.units.pos + '2'],
                    easing: 'easeOutQuart'
                };

                var animations = {};
                animations[data.axis.units.pos + '1'] = pos1Animation;
                animations[data.axis.units.pos + '2'] = pos2Animation;
                animations['opacity'] = {
                    begin: seq * delays,
                    dur: durations,
                    from: 0,
                    to: 1,
                    easing: 'easeOutQuart'
                };

                data.element.animate(animations);
            }
        });
    },

    getNormalizeDate: function(data, onlytime) {

    var dformat = null;
    var d = new Date(data);

    if(onlytime){
        dformat = [d.getHours().padLeft(), d.getMinutes().padLeft(), d.getSeconds().padLeft()].join(':');
    } else {
        dformat = [d.getDate().padLeft(), (d.getMonth()+1).padLeft(),  d.getFullYear()].join('.')
            + ' ' +
            [d.getHours().padLeft(), d.getMinutes().padLeft(), d.getSeconds().padLeft()].join(':');
    }

    return dformat;
},

    getTextAccountType: function (type_i) {
        switch(type_i) {
            case 0:
                return Conf.tr('Anonymous');
            case 1:
                return Conf.tr('Registered user');
            case 2:
                return Conf.tr('Merchant');
            case 3:
                return Conf.tr('Distribution agent');
            case 4:
                return Conf.tr('Settlement agent');
            case 5:
                return Conf.tr('Exchange agent');
            case 6:
                return Conf.tr('Bank account');
            case 7:
                return Conf.tr('Scratch card');
            case 8:
                return Conf.tr('Commission account');
            case 9:
                return Conf.tr('General agent');
            default:
                return Conf.tr('Unknown type');

        }
    },
};
module.exports = Helpers;