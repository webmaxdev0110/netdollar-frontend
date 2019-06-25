<?php

namespace App\Frontend\Controllers;

use \App\Models\Transactions;
use \Smartmoney\Stellar\Payment;
use \App\Models\Errors;

class TxController extends ControllerBase
{
    function indexAction(){

        $transactions =
            $this->modelsManager->createBuilder()
                ->columns([
                    'trn.trn_id',
                    'trn.trn_details',
                    'trn.trn_value',
                    'trn.tst_id',
                    'trn.trn_sender_acc_id as snd_acc_id',
                    'trn.trn_sender_account_number as snd_acc_num',
                    'trn.trn_sender_bank_number as snd_bank',
                    'trn.trn_hash',
                    'trn.trn_error',
                    'trn.trn_created',
                    'acc.act_id',
                    'acc.acc_num',
                    'act.act_title',
                    'act.act_description',
                    'cur.cur_code'
                ])
                ->addFrom('\App\Models\Transactions',       'trn')
                ->join('\App\Models\Accounts',              'trn.acc_id             = acc.acc_id', 'acc') //receiver account
                ->join('\App\Models\Currencies',            'acc.cur_id             = cur.cur_id', 'cur')
                ->join('\App\Models\Accounts_types',        'acc.act_id             = act.act_id', 'act') //receiver account type
                ->where('acc.act_id = :id: and cur.cur_code = :code:',
                    array(
                        'id'     => Transactions::ACC_TYPE_DIGITAL_MONEY,
                        'code'   => Transactions::CUR_CODE
                    )
                )
                ->orderBy('trn.trn_created')
                ->getQuery()
                ->execute();

        $tx_data = [];

        foreach ($transactions as $key => $trn) {

            preg_match('/[A-Z0-9]{56}/', $trn->trn_details, $matches);
            if (empty($matches[0])) {
                //account id not found in tx details
                continue;
            }

            $receiver_data  = $trn->acc_num         ? $trn->acc_num . ' '               : '';
            $receiver_data .= $trn->act_title       ? $trn->act_title . ' '             : '';
            $receiver_data .= $trn->act_description ? '(' . $trn->act_description . ')' : '';

            $trn->receiver_data = $receiver_data;

            $sender_data = $trn->snd_bank ? $this->_locale->_('External') . ': ' . $trn->snd_acc_num . ' (' . $trn->snd_bank . ')' : '';

            if (empty($sender_data)) {

                if(!empty($trn->snd_acc_id)){

                    $snd      = \App\Models\Accounts::findFirst($trn->snd_acc_id); //sender account data
                    $snd_type = \App\Models\Accounts_types::findFirst($snd->act_id); //sender account type data

                    $sender_data  = $snd->acc_num         ? $snd->acc_num . ' '               : '';
                    $sender_data .= $snd_type->act_title  ? $trn->act_title . ' '             : '';
                    $sender_data .= $trn->act_description ? '(' . $trn->act_description . ')' : '';
                    $sender_data  = $this->_locale->_('Internal') . ': ' .  $sender_data;

                } else {
                    $sender_data = $this->_locale->_('No data');
                }

            }

            $trn->sender_data = $sender_data;

            $tx_data[$key] = $trn;
        }

        $this->view->transactions = $tx_data;
        $this->tag->setTitle($this->_locale->_('Transactions') . ' | ' . $this->config->title);

    }

    function createAction()
    {
        //create transaction from existing internal account
        $accounts =
            $this->modelsManager->createBuilder()
                ->columns([
                    'acc.acc_id',
                    'acc.acc_value',
                    'acc.acc_num',
                    'act.act_title',
                    'act.act_description',
                    'cur.cur_code'
                ])
                ->addFrom('\App\Models\Accounts', 'acc')
                ->join('\App\Models\Currencies',            'acc.cur_id             = cur.cur_id', 'cur')
                ->join('\App\Models\Accounts_types',        'acc.act_id             = act.act_id', 'act') //receiver account type
                ->where('acc.act_id = :id:',
                    array(
                        'id'     => Transactions::ACC_TYPE_DIGITAL_MONEY
                    )
                )
                ->getQuery()
                ->execute();

        $this->view->accounts = $accounts;
        $this->view->com_len_limit = \App\Models\Transactions::MAX_COMMENT_LEN; //comment length limit

        if (!empty($this->request->getPost())) {

            //validate post
            $errors = array();

            $type = $this->request->getPost('type');

            if ($type == 'internal') {

                $trn_sender_acc_id = $this->request->getPost('trn_sender_acc_id');

                if(empty($trn_sender_acc_id)){
                    $errors[] = $this->_locale->_('Empty sender account id');
                }


            } elseif($type == 'external') {

                $trn_sender_bank_number = $this->request->getPost('trn_sender_bank_number');

                if(empty($trn_sender_bank_number)){
                    $errors[] = $this->_locale->_('Empty sender bank number');
                }

                $trn_sender_account_number = $this->request->getPost('trn_sender_account_number');

                if(empty($trn_sender_account_number)){
                    $errors[] = $this->_locale->_('Empty sender account number');
                }

            } else {
                $errors[] = $this->_locale->_('Bad transaction type');
            }

            //get receicer account id
            $acc_id = $this->request->getPost('acc_id');

            if(empty($acc_id)){
                $errors[] = $this->_locale->_('Empty receiver account id');
            }

            //get amount
            $trn_value = $this->request->getPost('trn_value');

            //reformat amount to coins view (*= 100)
            $trn_value = number_format($trn_value, 2, '.', '') * 100;
            if(empty($trn_value) || $trn_value <= 0){
                $errors[] = $this->_locale->_('Bad amount');
            }

            //get transaction details
            $trn_details = $this->request->getPost('trn_details');

            if(!empty($trn_details) && mb_strlen($trn_details) > \App\Models\Transactions::MAX_COMMENT_LEN){
                $errors[] = $this->_locale->_('Transaction details too long');
            }

            if(!empty($errors)){
                return $this->view->errors = $errors;
            }

            //if post is valid

            if ($type == 'internal') {

                $sender = \App\Models\Accounts::findFirst($trn_sender_acc_id); //sender account data

                //account not found
                if (empty($sender)) {
                    $errors[] = $this->_locale->_('Sender account not found');
                }

                //not enough money
                if (empty($sender->acc_value) || $sender->acc_value < $trn_value) {
                    $errors[] = $this->_locale->_('Not enough balance on sender account');
                }

                if(!empty($errors)){
                    return $this->view->errors = $errors;
                }

                try {

                    $sql = 'INSERT INTO public.transactions (acc_id, tst_id, trn_value, trn_sender_acc_id, trn_details)	
                             VALUES (?, ?, ?, ?, ?);';
                    $this->db->query($sql,
                        [
                            $acc_id,
                            \App\Models\Transactions::TX_TYPE_APPROVED,
                            $trn_value,
                            $trn_sender_acc_id,
                            $trn_details
                        ]
                    );

                    $sql = 'UPDATE public.accounts SET acc_value = acc_value - ? WHERE acc_id = ?;';
                    $this->db->query($sql, [$trn_value, $trn_sender_acc_id]);

                    $sql = 'UPDATE public.accounts SET acc_value = acc_value + ? WHERE acc_id = ?;';
                    $this->db->query($sql, [$trn_value, $acc_id]);

                    return $this->view->messages = [$this->_locale->_('Transaction successful complete')];

                } catch (\Exception $e) {
                    $errors[] = $e->getMessage();
                    return $this->view->errors = $errors;
                }

            } else {

                try {

                    $sql = 'INSERT INTO public.transactions (acc_id, tst_id, trn_value, trn_sender_account_number, trn_sender_bank_number,trn_details)	
                             VALUES (?, ?, ?, ?, ?, ?);';
                    $this->db->query($sql,
                        [
                            $acc_id,
                            \App\Models\Transactions::TX_TYPE_APPROVED,
                            $trn_value,
                            $trn_sender_account_number,
                            $trn_sender_bank_number,
                            $trn_details
                        ]
                    );

                    $sql = 'UPDATE public.accounts SET acc_value = acc_value + ? WHERE acc_id = ?;';
                    $this->db->query($sql, [$trn_value, $acc_id]);

                    return $this->view->messages = [$this->_locale->_('Transaction successful complete')];

                } catch (\Exception $e) {
                    $errors[] = $e->getMessage();
                    return $this->view->errors = $errors;
                }

            }

        }
        $this->tag->setTitle($this->_locale->_('Create transaction') . ' | ' . $this->config->title);
    }

}
