var Conf = require('../config/Config');

var Helpers = {

    getDateOnlyFromTimestamp: function (timestamp) {

        if (!timestamp || !parseInt(timestamp)) {
            return '';
        }

        var d = new Date(timestamp * 1000);
        var year = d.getFullYear();
        var month = this.transformToTwoDigits(d.getMonth() + 1);
        var day = this.transformToTwoDigits(d.getDate());

        return [day, month, year].join('.');
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

    getDateFromTimestamp: function (timestamp) {

        if (!timestamp || !parseInt(timestamp)) {
            return '';
        }

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

    getTextAgentType: function (type) {
        switch (type) {
            case StellarSdk.xdr.AccountType.accountMerchant().value:
                return Conf.tr("Merchant");
            case StellarSdk.xdr.AccountType.accountDistributionAgent().value:
                return Conf.tr("Distribution");
            case StellarSdk.xdr.AccountType.accountSettlementAgent().value:
                return Conf.tr("Settlement");
            case StellarSdk.xdr.AccountType.accountExchangeAgent().value:
                return Conf.tr("Exchange");
            default:
                return Conf.tr("Unknown agent type");
        }
    },

    getEnrollmentStageStatus: function (stage_status) {
        return Conf.tr(Conf.enrollments_statuses[stage_status]);
    },
    capitalizeFirstLetter: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    getTextAccountType: function (value) {
        var textAccountType = 'Unknown';
        Conf.account_types.map(function (type) {
            if (type.code == value) {
                textAccountType = type.name;
            }
        });
        return textAccountType;
    },
    getCodeAccountType: function (value) {
        var codeAccountType = -1;
        Conf.account_types.map(function (type) {
            if (type.name == value) {
                codeAccountType = type.code.toString();
            }
        });
        return codeAccountType;
    },

    encryptData: function (data, password) {
        if (typeof data !== 'string') {
            throw new TypeError('data must be a String.');
        }

        if (typeof password !== 'string') {
            throw new TypeError('password must be a String.');
        }

        var encrypted = sjcl.encrypt(password, data);
        return btoa(encrypted);
    },

    download: function (fileNameToSaveAs, textToWrite) {
        /* Saves a text string as a blob file */
        var ie     = navigator.userAgent.match(/MSIE\s([\d.]+)/),
            ie11   = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/),
            ieEDGE = navigator.userAgent.match(/Edge/g),
            ieVer  = (ie ? ie[1] : (ie11 ? 11 : (ieEDGE ? 12 : -1)));

        if (ie && ieVer < 10) {
            console.log("No blobs on IE ver<10");
            return;
        }

        var textFileAsBlob = new Blob([textToWrite], {
            type: 'text/plain'
        });

        if (ieVer > -1) {
            window.navigator.msSaveBlob(textFileAsBlob, fileNameToSaveAs);
        } else {

            var is_safari = false;

            var ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf('safari') != -1) {
                if (ua.indexOf('chrome') == -1) {
                    is_safari = true;
                }
            }

            if (is_safari) {
                alert(Conf.tr("In Safari browser may be problems with downloading files. If Safari opened file in a new tab, instead of downloading, please click ⌘+S and save the file with the extension .smb (For example: file.smb)In Safari browser may be problems with downloading files. If Safari opened file in a new tab, instead of downloading, please click ⌘+S and save the file with the extension .smb (For example: file.smb)"));
            }

            var downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = function (e) {
                document.body.removeChild(e.target);
            };
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
            downloadLink.click();
        }
    },

    long2ip: function (ip) {
        //   example 1: long2ip( 3221234342 )
        //   returns 1: '192.0.34.166'

        if (!isFinite(ip)) {
            return false
        }

        return [ip >>> 24, ip >>> 16 & 0xFF, ip >>> 8 & 0xFF, ip & 0xFF].join('.')
    }

};
module.exports = Helpers;