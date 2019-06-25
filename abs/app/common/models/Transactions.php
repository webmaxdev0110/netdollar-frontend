<?php

namespace App\Models;

class Transactions extends ModelBase
{
    const TX_TYPE_APPROVED       = 2;
    const TX_TYPE_EM_VALIDATION  = 4;
    const TX_TYPE_EM_REJECTED    = 5;
    const TX_TYPE_EM_SUCCESS     = 6;

    const MAX_ERROR_TITLE_LEN    = 128;
    const MAX_ERROR_DESC_LEN     = 256;
    const MAX_COMMENT_LEN        = 160;

    const ACC_TYPE_DIGITAL_MONEY = 3;
    const CUR_CODE               = 'UAH';
}