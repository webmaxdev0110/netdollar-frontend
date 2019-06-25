<?php
	$router->add('/:params', array(
		'controller' => 'index',
		'action' => 'index'
	));

	$router->add('/:controller/:action/:params', array(
		'controller' => 1,
		'action' => 2,
		'params' => 3
	));

	$router->add('/:controller/:action', array(
		'controller' => 1,
		'action' => 2,
	));

	$router->add('/:controller', array(
		'controller' => 1,
	));

	// $router->notFound(array(
	    // "controller" => "index",
	    // "action" => "index"
	// ));