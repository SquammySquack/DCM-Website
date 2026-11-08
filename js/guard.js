/* Sends visitors without the right demo session back to the login page.
   Usage: <script src="js/guard.js" data-role="client"></script> (runs before the page paints) */
(function () {
  var role = document.currentScript && document.currentScript.dataset.role;
  var s = null;
  try { s = JSON.parse(sessionStorage.getItem('dcm_session')); } catch (e) {}
  if (!s || s.role !== role) window.location.replace('loginpage.html?role=' + role);
})();
