<?php
namespace App\Frontend\Controllers;

use Phalcon\Mvc\Controller as Controller;
use Phalcon\Translate\Adapter\NativeArray;

class ControllerBase extends Controller
{
    protected $_session;
    protected $_token;
    protected $_locale;

    /**
     * This function is called before dispatcher executes every route
     * Routing and logics for different acc types is implemented here
     */
    public function beforeExecuteRoute($dispatcher)
    {
        if (empty($this->config->master->public)) {
            throw new \Exception('Empty Master account public key in config');
        }

        $translate_messages = $this->getTranslationMessages();
        $this->_locale = new NativeArray(["content" => $translate_messages]);

        $this->view->js_locale = $this->getJsTranslation($translate_messages);
        $this->view->locale = $this->_locale;

        $this->view->current_url = $_SERVER['REQUEST_URI'];

    }

    protected function initialize()
    {
        $this->assets->collection('header')->addJs('/bower_components/jquery/dist/jquery.min.js');

        $this->assets
            ->addCss('/bower_components/bootstrap/dist/css/bootstrap.min.css')
            ->addCss('/bower_components/metisMenu/dist/metisMenu.min.css')
            ->addCss('/bower_components/morrisjs/morris.css')
            ->addCss('/bower_components/font-awesome/css/font-awesome.min.css')
            ->addCss('/template/plugins/switchery/switchery.min.css')
            ->addCss('/template/css/core.css')
            ->addCss('/template/css/icons.css')
            ->addCss('/template/css/components.css')
            ->addCss('/template/css/pages.css')
            ->addCss('/template/css/menu.css')
            ->addCss('/template/css/responsive.css')
            ->addCss('/template/css/jquery.alerts.css')
            ->addCss('/css/main.css')
            //add basic js
            ->addJs('/bower_components/bootstrap/dist/js/bootstrap.min.js')
            ->addJs('/bower_components/metisMenu/dist/metisMenu.min.js')
            ->addJs('/bower_components/morrisjs/morris.min.js')
            ->addJs('/bower_components/jquery-validation/dist/jquery.validate.min.js')
            ->addJs('/node_modules/stellar-sdk/dist/stellar-sdk.min.js')
            ->addJs('/node_modules/stellar-wallet-js-sdk/build/stellar-wallet.js')
            ->addJs('/node_modules/sjcl/sjcl.js')
            //add template js
            ->addJs('/template/js/detect.js')
            ->addJs('/template/js/jquery.slimscroll.js')
            ->addJs('/template/js/fastclick.js')
            ->addJs('/template/js/waves.js')
            ->addJs('/template/js/wow.min.js')
            ->addJs('/template/plugins/switchery/switchery.min.js')
            // notify scripts
            ->addJs('/template/plugins/notifyjs/dist/notify.min.js')
            ->addJs('/template/plugins/notifications/notify-metro.js')
            ->addJs('/template/js/jquery.core.js')
            ->addJs('/template/js/jquery.app.js')
            ->addJs('/template/js/jquery.alerts.js');


        $this->tag->setTitle('Dashboard | Welcome');

        //$this->view->admin = $this->_admin;
    }

    protected function maybeForward($controller, $action, $redirect = false)
    {
        if ($this->dispatcher->getControllerName() != $controller || $this->dispatcher->getActionName() != $action) {
            if ($redirect) {
                $this->response->redirect($controller . '/' . $action);

                return $this->response->send();
            }

            return $this->dispatcher->forward([
                'controller' => $controller,
                'action'     => $action
            ]);
        }
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

    protected function getJsTranslation($messages)
    {
        $js_prefix = 'js_';

        $js_messages = []; // default js translation array

        foreach ($messages as $key => $message) {

            if (empty($key)) {
                continue;
            }

            if (mb_substr($key, 0, mb_strlen($js_prefix)) != $js_prefix) {
                continue;
            }

            $js_messages[$key] = $message;
        }

        return json_encode($js_messages);
    }
}

