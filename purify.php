<?php

require_once 'HTMLPurifier.auto.php';
$purifier = new HTMLPurifier();
$clean_html = $purifier->purify($dirty_html);
