StellarSdk.Network.use(new StellarSdk.Network(process.env.STELLAR_NETWORK));

window.getPromptValue = function(label, message) {
    return new Promise(function (resolve, reject) {
        jPrompt(message, '', label, locale.js_button_ok, locale.js_button_cancel, function (result) {
            resolve(result);
        });
    });
}

window.uploadFile = function(file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.fileName = file.name;
    reader.onload = function (evt) {
        if (evt.target.result) {
        	var data = JSON.parse(evt.target.result);
            if (typeof data.operation != 'undefined') {
                var tx = new StellarSdk.Transaction(data.tx);
                if (data.operation == 'emission') {
                    if (data.tx) {
                        getPromptValue(locale.js_message, locale.js_enter_em_mnemonic)
                            .then(function (emission_mnemonic) {
                                if (typeof emission_mnemonic == 'string' && emission_mnemonic.length > 0) {
                                    var emission = StellarSdk.Keypair.fromSeed(StellarSdk.getSeedFromMnemonic(emission_mnemonic));
                                    tx.sign(emission);
                                    data.tx = tx.toEnvelope().toXDR().toString("base64");
                                    var fileName = (typeof evt.target.fileName === 'undefined') ? 'signed_emission.smb' : evt.target.fileName;
                                    download('signed_' + fileName + 'x', JSON.stringify(data));
                                }
                                clearDropzone();
                            })
                            .catch(function (e) {
                                console.error(e);
                                return flashAlert(locale.js_cannot_decrypt + ': ' + locale.js_wrong_password, 'error');
                            });
                    } else {
                        return flashAlert(locale.dictInvalidFileType, 'error');
                    }
                } else {
                    if (data.tx && data.account && data.seed) {
                        getPromptValue(locale.js_message, locale.js_enter_master_mnemonic)
                            .then(function (master_mnemonic) {
                                if (typeof master_mnemonic == 'string' && master_mnemonic.length > 0) {
                                    var master = StellarSdk.Keypair.fromSeed(StellarSdk.getSeedFromMnemonic(master_mnemonic));
                                    tx.sign(master);
                                    data.tx = tx.toEnvelope().toXDR().toString("base64");
                                    var fileName = (typeof evt.target.fileName === 'undefined') ? 'signed_transaction.smb' : evt.target.fileName;
                                    download('signed_' + fileName + 'x', JSON.stringify(data));
                                }
                                clearDropzone();
                            })
                            .catch(function (e) {
                                console.error(e);
                                return flashAlert(locale.js_cannot_decrypt + ': ' + locale.js_wrong_password, 'error');
                            });
                    } else {
                        return flashAlert(locale.dictInvalidFileType, 'error');
                    }
                }
            } else {
                return flashAlert(locale.dictInvalidFileType, 'error');
            }

        }
    }
    reader.onerror = function (evt) {
        alert('Error reading file');
    }
}

window.download = function(fileNameToSaveAs, textToWrite) {
    /* Saves a text string as a blob file*/
    var ie = navigator.userAgent.match(/MSIE\s([\d.]+)/),
        ie11 = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/),
        ieEDGE = navigator.userAgent.match(/Edge/g),
        ieVer = (ie ? ie[1] : (ie11 ? 11 : (ieEDGE ? 12 : -1)));

    if (ie && ieVer < 10) {
        return console.log("No blobs on IE ver<10");
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
            alert(locale.js_safari_download_message);
        }

        var downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = function(e) {
            document.body.removeChild(e.target);
        };
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
    }
}

window.clearDropzone = function(){
    Dropzone.forElement(".dropzone").removeAllFiles(true);
}


window.flashAlert = function(msg, cls) {
    if (typeof cls == 'undefined') {
        cls = 'info';
    }
    
    $.Notification.notify(cls, 'top right', locale.js_message, msg)
    Dropzone.forElement(".dropzone").removeAllFiles(true);
}
