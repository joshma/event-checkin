<?php
// error_reporting(E_ALL);
// ini_set("display_errors", 1);

// IF POST, LOOK UP LDAP INSTEAD.
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $email = strtolower($email);

    // Roughly remove @mit.edu part of email.
    if (preg_match("/mit.edu/",$email)) {
        $email = substr($email, 0, strlen($email) - strlen('@mit.edu'));
    }
    $athena = $email;

    // Run ldaps, utility from SIPB to help search on LDAP.
    $dir = dirname(__FILE__);
    exec("$dir/ldaps $athena mitDirStudentYear cn ou", $output_arr);
    $name = "";
    $year = "";
    $course = "";
    foreach ($output_arr as $line) {
        $name_prefix = "cn: ";
        $year_prefix = "mitDirStudentYear: ";
        $course_prefix = "ou: ";
        if (substr($line, 0, strlen($name_prefix)) == $name_prefix) {
            $name = substr($line, strlen($name_prefix));
        }
        if (substr($line, 0, strlen($year_prefix)) == $year_prefix) {
            $year = substr($line, strlen($year_prefix));
        }
        if (substr($line, 0, strlen($course_prefix)) == $course_prefix) {
            $course = substr($line, strlen($course_prefix));
        }
    }
    // Return JSON response.
    if (strlen($name) > 0) {
        echo "{";
        echo '"name": "', $name, '",';
        echo '"year": "', $year, '",';
        echo '"course": "', $course, '"';
        echo "}";
    } else {
        header('HTTP/1.0 400 Invalid Athena', true, 400);
    }
    return;
}
?>
<!DOCTYPE html>
<html>
<head>
  <script src="dymo.latest.js"></script>
  <script src="jquery-1.9.0.min.js"></script>
  <script src="athenas.js"></script>
  <script src="script.js"></script>
  <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="instructions">Enter your MIT athena username:</div>
  <div id="loading" class="hide"><div>
    <div class="div0"></div>
    <div class="div1"></div>
    <div class="div2"></div>
    <div class="div3"></div>
  </div></div>
  <div id="cool-textbox"></div>
  <form class="fade-out">
    <p>Make any necessary changes with TAB. <br> Then hit ENTER to print your nametag.</p>
    <input type="text" id="form-name" />
    <input type="text" id="form-year" />
    <input type="text" id="form-course" />
  </form>
</body>
</html>
