<?php

use \App\Models\Transactions;
use \Smartmoney\Stellar\Payment;
use \Smartmoney\Stellar\Account;
use \Smartmoney\Stellar\Error as StellarError;
use \App\Models\Errors;

class IndexTask extends TaskBase
{

    private $_currencies_map = [
        'UAH' => 'EUAH',
    ];

    public function paymentshandlerAction()
    {

        sleep(60);

        while(1) {

            $transactions =
                $this->modelsManager->createBuilder()
                    ->columns([
                        'trn.trn_id',
                        'trn.trn_details',
                        'trn.trn_value',
                        'trn.acc_id',
                        'acc.act_id',
                        'acc.cur_id',
                        'cur.cur_code'
                    ])
                    ->addFrom('\App\Models\Transactions', 'trn')
                    ->join('\App\Models\Accounts',   'trn.acc_id = acc.acc_id', 'acc')
                    ->join('\App\Models\Currencies', 'acc.cur_id = cur.cur_id', 'cur')
                    ->where('acc.act_id = :id: and cur.cur_code = :code: and trn.tst_id = :tst_id:',
                        array(
                            'id'     => Transactions::ACC_TYPE_DIGITAL_MONEY,
                            'code'   => Transactions::CUR_CODE,
                            'tst_id' => Transactions::TX_TYPE_APPROVED
                        )
                    )
                    ->getQuery()
                    ->execute();

            foreach ($transactions as $transaction) {

                preg_match('/[A-Z0-9]{56}/', $transaction->trn_details, $matches);
                if (empty($matches[0])) {
                    //account id not found in tx details
                    continue;
                }

                $account = $matches[0];

                $tx_object = Transactions::findFirst($transaction->trn_id);
                if (!$tx_object) {
                    //record deleted while script run or magic disappeared
                    continue;
                }

                $error_title = false; //type of error for Errors model
                $error_desc  = false; //details of error for Transaction model

                //verify abs transaction data
                $value = $transaction->trn_value;

                if (empty($value)) {
                    $error_title = $this->getErrorLocale(Errors::BAD_VALUE);
                    $error_desc  = $this->_locale->_('Amount of transaction is empty');
                } elseif ($value <= 0) {
                    $error_title = $this->getErrorLocale(Errors::BAD_VALUE);
                    $error_desc  = $this->_locale->_('Amount of transaction is 0 or below') . (isset($value) ? ' (' . $value . ')' : '');
                }

                if (empty($transaction->cur_code)) {
                    $error_title = $this->getErrorLocale(Errors::BAD_ASSET);
                    $error_desc  = $this->_locale->_('Asset of transaction is empty');
                } else {
                    $asset = $this->getCurrencyMapValue($transaction->cur_code);
                    if (empty($asset)) {
                        $error_title = $this->getErrorLocale(Errors::BAD_ASSET);
                        $error_desc  = $this->_locale->_('Asset of transaction is not supported') . '(' . $transaction->cur_code . ')';
                    }
                }

                if (!empty($error_title) && !empty($error_desc)) {
                    $this->handleError($tx_object, $error_title, $error_desc);
                    continue;
                }

                //create config for sending payment
                $needle_config =  (object)[
                    'emission' => (object)[
                        'username'  => $this->config->emission_module->username,
                        'password'  => $this->config->emission_module->password,
                        'url'       => $this->config->emission_module->host . '/issue'
                    ],
                    'horizon_host' => $this->config->horizon->host
                ];

                //set status to "emission validation"
                $tx_object->tst_id = Transactions::TX_TYPE_EM_VALIDATION;
                $tx_object->save();

                $payment_result = Payment::sendPaymentByEmission($account, $value, $asset, $needle_config);
                $decode_result  = json_decode($payment_result);

                //verify emission response

                $error_data = null;
                //if get error while send payment
                if (!empty($decode_result->error)) {
                    $error_data = $this->getErrorCodeAndDescription($decode_result->error);
                }
                elseif (!empty($decode_result->request_error)) {
                    $error_data = $this->getErrorCodeAndDescription($decode_result->request_error);
                }
                //if errors is empty, but no tx_hash (unknown error)
                elseif (empty($decode_result->tx_hash)) {
                    $error_title  = Errors::ERR_UNKNOWN_TITLE;
                    $error_desc   = $decode_result;
                }

                if(!is_null($error_data)) {

                    $error_title = !empty($error_data['title']) ? $error_data['title'] : Errors::ERR_UNKNOWN_TITLE;

                    $error_desc  = null;
                    if (!empty($error_data['code'])) {

                        switch ($error_data['code']) {

                            //stellar errors
                            case StellarError::INV_ACC:

                                $error_desc = $this->getErrorLocale('Account is invalid') . ($account ? ' (' . $account . ')' : '');
                                break;

                            case StellarError::BAD_PARAMS:

                                $error_desc = $this->getErrorLocale('At least one parameter is empty (account, amount or/and asset');
                                break;

                            //errors from emission daemon
                            case Errors::INV_ACC_ID:

                                $error_desc = $this->getErrorLocale('Account is invalid') . ($account ? ' (' . $account . ')' : '');
                                break;

                            case Errors::EMP_ACC_ID:

                                $error_desc = $this->getErrorLocale('Account is empty') . ($account ? ' (' . $account . ')' : '');
                                break;

                            case Errors::BAD_ASSET:

                                $error_desc = $this->getErrorLocale('Asset is invalid') . ($asset ? ' (' . $asset . ')' : '');
                                break;

                            case Errors::EMP_ASSET:

                                $error_desc = $this->getErrorLocale('Asset is empty') . ($asset ? ' (' . $asset . ')' : '');
                                break;

                            case Errors::EMP_AMOUNT:

                                $error_desc = $this->getErrorLocale('Amount is empty') . ($value ? ' (' . $value . ')' : '');
                                break;

                            case Errors::BAD_AMOUNT:

                                $error_desc = $this->getErrorLocale('Amount is invalid') . ($value ? ' (' . $value . ')' : '');
                                break;

                            case Errors::BAD_AGENT_TYPE:

                                $error_desc  = $this->getErrorLocale('Account has bad type') . ($account ? ' (' . $account . ')' : '') . ' ';
                                $error_desc .= $this->_locale->_('Expected') . ': ' . $this->_locale->_('Distribution agent') . ' ';
                                $error_desc .= $this->_locale->_('Get') . ': ' .
                                    Account::getTextAccountTypeById(Account::getAccountType($account, $needle_config->horizon->host));
                                break;

                            case Errors::OP_BLOCK:

                                $error_desc = $this->getErrorLocale('Incoming operation for account is blocked') . ($account ? ' (' . $account . ')' : '');
                                break;

                            case Errors::OP_LIMIT_EX:

                                $error_desc = $this->getErrorLocale('Account has exceeded operation limit') . ($account ? ' (' . $account . ')' : '');
                                break;

                            case Errors::DAILY_OP_LIMIT_EX:

                                $error_desc = $this->getErrorLocale('Account has exceeded daily operation limit') . ($account ? ' (' . $account . ')' : '');
                                break;

                            case Errors::MONTHLY_OP_LIMIT_EX:

                                $error_desc = $this->getErrorLocale('Account has exceeded monthly operation limit') . ($account ? ' (' . $account . ')' : '');
                                break;

                            case Errors::BAD_AUTH:

                                $error_desc = $this->getErrorLocale('Auth parameters incorrect');
                                break;

                            case Errors::ERR_BAD_BANK_ACC:

                                $error_desc = $this->getErrorLocale('Emission bank account is invalid');
                                break;

                            case Errors::ERR_TX_DECLINED:

                                $error_desc = $this->getErrorLocale('Emission transaction has been declined');
                                break;

                            case Errors::ERR_RESTRICTED:

                                $error_desc = $this->getErrorLocale('Account has been restricted');
                                break;

                            case Errors::UNKNOWN_ERR:

                                $error_desc = $this->getErrorLocale('Emission unknown error');
                                break;

                            case Errors::EM_SERVER_OFF:

                                $error_desc = $this->getErrorLocale('Emission server not answer. Probably, it\'s off. Contact administrator');
                                break;

                            default:
                                $error_desc = $this->getErrorLocale('No details');

                        }
                    }
                }

                if (!empty($error_title) && !empty($error_desc)) {
                    $this->handleError($tx_object, $error_title, $error_desc);
                    continue;
                }

                //all right, payment complete, save hash and set status to success
                $tx_object->tst_id    = Transactions::TX_TYPE_EM_SUCCESS;
                $tx_object->trn_hash  = $decode_result->tx_hash;
                $tx_object->save();

            }

            sleep(1);

        }

    }

    /**
     * @param $error - error object from payment function
     */
    private function getErrorCodeAndDescription($error){

        //trying to get info from error response (code, localize message)

        $error = base64_decode($error) ? base64_decode($error) : $error; //try to get base64 decode from error response
        $decode_error = json_decode($error);

        $code  = !empty($decode_error->err_code) ? $decode_error->err_code : $error;
        $title = !empty($decode_error->err_msg)  ? $this->getErrorLocale($decode_error->err_msg) : $this->getErrorLocale($error);

        if(strripos($title, '502 Bad Gateway') !== false) {
            $code  = Errors::EM_SERVER_OFF;
            $title = Errors::EM_SERVER_OFF;
        }

        return [
            'code'  => $code,
            'title' => $title
        ];

    }

    //validate error title and error description for length and save errors
    private function handleError($tx_object, $error_title, $error_desc)
    {
        if(mb_strlen($error_title) > Transactions::MAX_ERROR_TITLE_LEN){
            $error_title = mb_substr($error_title, 0, Transactions::MAX_ERROR_TITLE_LEN);
        }

        //get error by title
        $errors_object = Errors::findFirst([
            'err_title = :err_title:',
            'bind' => [
                'err_title'    => $error_title
            ]
        ]);

        //if not exist - create new
        if (empty($errors_object)) {
            $errors_object = new Errors();
            $errors_object->err_title = $error_title;
            $errors_object->save();
        }

        if (mb_strlen($error_desc) > Transactions::MAX_ERROR_DESC_LEN) {
            $error_desc = mb_substr($error_desc, 0, Transactions::MAX_ERROR_DESC_LEN);
        }

        //set status to "emission rejected"
        $tx_object->tst_id    = Transactions::TX_TYPE_EM_REJECTED;

        $tx_object->err_id    = $errors_object->err_id;
        $tx_object->trn_error = $error_desc;

        $tx_object->save();
    }

    private function getCurrencyMapValue($cur_code)
    {
        if (array_key_exists($cur_code, $this->_currencies_map)) {
            return $this->_currencies_map[$cur_code];
        }
        return false;
    }

    private function getErrorLocale($err_msg)
    {
        return $this->_locale->_($err_msg);
    }
}
