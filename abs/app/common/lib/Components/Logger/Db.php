<?php

namespace App\Lib\Components\Logger;

use Phalcon\Db\Column;
use Phalcon\Logger\Exception;
use Phalcon\Logger\Formatter\Line as LineFormatter;
use Phalcon\Logger\Adapter as LoggerAdapter;
use Phalcon\Logger\AdapterInterface;
use Phalcon\Db\AdapterInterface as DbAdapterInterface;

/**
 * Database Logger
 *
 * Adapter to store logs in a database table
 *
 * @package Phalcon\Logger\Adapter
 */
class Db extends LoggerAdapter implements AdapterInterface
{
    /**
     * Adapter options
     * @var array
     */
    protected $options = [];

    /**
     * @var \Phalcon\Db\AdapterInterface
     */
    protected $db;

    /**
     * Class constructor.
     *
     * @param  string $name
     * @param  array  $options
     * @throws \Phalcon\Logger\Exception
     */
    public function __construct(array $options = [])
    {
        if (!isset($options['db'])) {
            throw new Exception("Parameter 'db' is required");
        }

        if (!$options['db'] instanceof DbAdapterInterface) {
            throw new Exception("Parameter 'db' must be object and implement AdapterInterface");
        }

        if (!isset($options['table'])) {
            throw new Exception("Parameter 'table' is required");
        }

        $this->db      = $options['db'];
        $this->options = $options;
    }

    /**
     * Sets database connection
     *
     * @param AdapterInterface $db
     * @return $this
     */
    public function setDb(AdapterInterface $db)
    {
        $this->db = $db;

        return $this;
    }

    /**
     * {@inheritdoc}
     *
     * @return \Phalcon\Logger\FormatterInterface
     */
    public function getFormatter()
    {
        if (!is_object($this->_formatter)) {
            $this->_formatter = new LineFormatter();
        }

        return $this->_formatter;
    }

    /**
     * Writes the log to the file itself
     *
     * @param string  $message
     * @param integer $type
     * @param integer $time
     * @param array   $context
     * @return bool
     */
    public function logInternal($message, $type, $time, $context = [])
    {
        return $this->db->execute(
            'INSERT INTO ' . $this->options['table'] . '
            (log_type, log_message)
            VALUES (?, ?)',
            [$type, $message],
            [\Phalcon\Db\Column::BIND_PARAM_INT, \Phalcon\Db\Column::BIND_PARAM_STR]
        );
    }

    /**
     * {@inheritdoc}
     *
     * @return boolean
     */
    public function close()
    {
        if ($this->db->isUnderTransaction()) {
            $this->db->commit();
        }

        $this->db->close();

        return true;
    }

    /**
     * {@inheritdoc}
     *
     * @return $this
     */
    public function begin()
    {
        $this->db->begin();

        return $this;
    }

    /**
     * Commit transaction
     *
     * @return $this
     */
    public function commit()
    {
        $this->db->commit();

        return $this;
    }

    /**
     * Rollback transaction
     * (happens automatically if commit never reached)
     *
     * @return $this
     */
    public function rollback()
    {
        $this->db->rollback();

        return $this;
    }
}