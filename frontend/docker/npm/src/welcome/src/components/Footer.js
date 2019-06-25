module.exports = {
    controller: function() {
        var ctrl = this;
    },

    view: function(ctrl) {
        return <footer class="footer footer-full-width">
            <div class="container">
                <div class="row">
                    <div class="col-xs-12 text-center">
                        © 2016 - {new Date().getFullYear()} made by <a href="http://netdollar.ca">Netdollar</a>
                    </div>
                </div>
            </div>
        </footer>
    }
};
