<?php
require_once 'HTMLPurifier.auto.php';
$purifier = new HTMLPurifier();
$clean_html = $purifier->purify($dirty_html);
if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $dirty_html = $_POST['data'];
    echo $clean_html;
}
