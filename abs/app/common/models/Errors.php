<?php

namespace App\Models;

class Errors extends ModelBase
{
    const ERR_UNKNOWN_TITLE     = 'Unknown error';

    const BAD_VALUE             = 'Transaction value is empty or bad';
    const BAD_ASSET             = 'Asset is empty or bad';

    const EM_SERVER_OFF         = 'Emission server not answer';

    //emmissions errors
    const BAD_AUTH              = 100;
    const INV_ACC_ID            = 101;
    const BAD_AMOUNT            = 102;
    const EMP_ACC_ID            = 103;
    const EMP_AMOUNT            = 104;
    const EMP_ASSET             = 105;
    const UNKNOWN_ERR           = 200;
    const BAD_AGENT_TYPE        = 201;
    const ERR_BAD_BANK_ACC      = 202;
    const ERR_TX_DECLINED       = 203;
    const ERR_RESTRICTED        = 205;
    const OP_LIMIT_EX           = 206;
    const DAILY_OP_LIMIT_EX     = 207;
    const MONTHLY_OP_LIMIT_EX   = 208;
    const OP_BLOCK              = 209;
}