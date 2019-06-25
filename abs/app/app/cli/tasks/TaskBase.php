<?php

use Phalcon\Translate\Adapter\NativeArray;

class TaskBase extends \Phalcon\CLI\Task
{

    protected $_locale;

    public function initialize()
    {
        $translate_messages = $this->getTranslationMessages();
        $this->_locale = new NativeArray(["content" => $translate_messages]);
    }

    protected function getTranslationMessages()
    {
        // $language = strtok($this->request->getBestLanguage(), '-') ;
        $language = 'ua';
        $messages = []; // default array

        //Check if we have a translation file for that lang
        $fpath = __DIR__ . '/../locale/' . $language . '.php';
        if (strlen($language) == 2 && file_exists($fpath)) {
            require $fpath;
        }

        return $messages;
    }

    public function debug($text = false, $color = false, $bg = false)
    {
        if (empty($text) || !$this->di->has('verbose')) {
            return false;
        }

        $text_colors = array(
            'black'      => '0;30',         'darkgray'     => '1;30',
            'blue'       => '0;34',         'light_blue'    => '1;34',
            'green'      => '0;32',         'light_green'   => '1;32',
            'cyan'       => '0;36',         'light_cyan'    => '1;36',
            'red'        => '0;31',         'light_red'     => '1;31',
            'purple'     => '0;35',         'light_purple'  => '1;35',
            'brown'      => '0;33',         'yellow'       => '1;33',
            'light_gray' => '0;37',         'white'        => '1;37',
        );

        $bg_colors = array(
            'black'         => '40',
            'red'           => '41',
            'green'         => '42',
            'yellow'        => '43',
            'blue'          => '44',
            'magenta'       => '45',
            'cyan'          => '46',
            'light_gray'    => '47',
        );

        $output = "";

        if (!empty($color) && isset($text_colors[$color])) {
            $output .= "\e[" . $text_colors[$color] . "m";
        }

        if (!empty($bg) && isset($bg_colors[$bg])) {
            $output .= "\e[" . $bg_colors[$bg] . "m";
        }

        $output .=  $text . "\e[0m";
        echo $output . PHP_EOL;
    }
}