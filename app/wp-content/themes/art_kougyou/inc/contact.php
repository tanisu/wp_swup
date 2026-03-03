<?php

function swup_minimal_sanitize_contact_to_email($value) {
  $email = sanitize_email($value);
  if ($email === '' || !is_email($email)) {
  add_settings_error(
  'swup_minimal_contact_to_email',
  'swup_minimal_contact_to_email_invalid',
  'お問い合わせ受信メールアドレスの形式が正しくありません。'
  );
  return '';
  }

  return $email;
}

function swup_minimal_render_contact_to_email_field() {
  $value = get_option('swup_minimal_contact_to_email', '');
  ?>
  <input
  type="email"
  id="swup_minimal_contact_to_email"
  name="swup_minimal_contact_to_email"
  value="<?php echo esc_attr($value); ?>"
  class="regular-text"
  >
  <p class="description">
  お問い合わせフォームの通知先メールアドレスです。未設定時は「管理者メールアドレス」を使用します。
  </p>
  <?php
}

function swup_minimal_register_contact_settings() {
  register_setting(
  'general',
  'swup_minimal_contact_to_email',
  array(
  'type' => 'string',
  'sanitize_callback' => 'swup_minimal_sanitize_contact_to_email',
  'default' => '',
  )
  );

  add_settings_field(
  'swup_minimal_contact_to_email',
  'お問い合わせ受信メールアドレス',
  'swup_minimal_render_contact_to_email_field',
  'general'
  );
}
add_action('admin_init', 'swup_minimal_register_contact_settings');

function swup_minimal_contact_start_session() {
  if (is_admin()) {
  return;
  }

  if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
  }
}
add_action('init', 'swup_minimal_contact_start_session', 1);

function swup_minimal_contact_default_values() {
  $values = array();
  foreach (swup_minimal_contact_fields() as $key => $field) {
  $values[$key] = (($field['input_type'] ?? '') === 'checkbox' && !empty($field['multiple'])) ? array() : '';
  }

  return $values;
}

/* お問い合わせを増やしたいときはここを使う */
function swup_minimal_contact_fields() {
  return array(
  'inquiry_type' => array(
  'label' => 'お問い合わせ種別',
  'required' => true,
  'input_type' => 'select',
  'options' => array(
  'estimate' => '見積もり依頼',
  'consultation' => '相談',
  'other' => 'その他',
  ),
  ),
  'name' => array(
  'label' => 'お名前',
  'required' => true,
  'input_type' => 'text',
  'autocomplete' => 'name',
  ),
  'email' => array(
  'label' => 'メールアドレス',
  'required' => true,
  'input_type' => 'email',
  'autocomplete' => 'email',
  ),
  'phone' => array(
  'label' => '電話番号',
  'required' => false,
  'input_type' => 'text',
  'autocomplete' => 'tel',
  'placeholder' => '03-1234-5678',
  ),
  'contact_method' => array(
  'label' => '希望連絡方法',
  'required' => true,
  'input_type' => 'radio',
  'options' => array(
  'email' => 'メール',
  'phone' => '電話',
  ),
  ),
  'interest_services' => array(
  'label' => '興味のあるサービス',
  'required' => false,
  'input_type' => 'checkbox',
  'multiple' => true,
  'options' => array(
  'website' => 'Web制作',
  'seo' => 'SEO改善',
  'support' => '運用サポート',
  ),
  ),
  'company' => array(
  'label' => '会社名',
  'required' => false,
  'input_type' => 'text',
  'autocomplete' => 'organization',
  ),
  'message' => array(
  'label' => 'お問い合わせ内容',
  'required' => true,
  'input_type' => 'textarea',
  'rows' => 6,
  ),
  );
}

function swup_minimal_contact_sanitize_input($raw_input) {
  $sanitized = swup_minimal_contact_default_values();
  $fields = swup_minimal_contact_fields();

  foreach ($fields as $key => $field) {
  $type = $field['input_type'] ?? 'text';
  $options = isset($field['options']) && is_array($field['options']) ? array_keys($field['options']) : array();

  if ($type === 'checkbox' && !empty($field['multiple'])) {
  $raw_values = isset($raw_input[$key]) && is_array($raw_input[$key]) ? wp_unslash($raw_input[$key]) : array();
  $clean_values = array_map('sanitize_text_field', $raw_values);
  if (!empty($options)) {
  $clean_values = array_values(array_intersect($clean_values, $options));
  }
  $sanitized[$key] = $clean_values;
  continue;
  }

  $raw = isset($raw_input[$key]) ? wp_unslash($raw_input[$key]) : '';
  if ($key === 'email') {
  $sanitized[$key] = sanitize_email($raw);
  } elseif ($type === 'textarea') {
  $sanitized[$key] = sanitize_textarea_field($raw);
  } elseif ($type === 'checkbox') {
  $value = $raw ? '1' : '';
  $sanitized[$key] = $value;
  } elseif ($type === 'select' || $type === 'radio') {
  $value = sanitize_text_field($raw);
  if (!empty($options) && !in_array($value, $options, true)) {
  $value = '';
  }
  $sanitized[$key] = $value;
  } else {
  $sanitized[$key] = sanitize_text_field($raw);
  }
  }

  return $sanitized;
}

function swup_minimal_contact_mail_detail_lines($data) {
  $lines = array();
  $fields = swup_minimal_contact_fields();

  foreach ($fields as $key => $field) {
  $label = $field['label'];
  $value = isset($data[$key]) ? $data[$key] : '';
  $display = swup_minimal_contact_format_value_for_display($key, $value);

  if ($key === 'message') {
  $lines[] = $label . ':';
  $lines[] = $display;
  continue;
  }

  $lines[] = $label . ': ' . $display;
  }

  return $lines;
}

function swup_minimal_contact_from_email() {
  $host = wp_parse_url(home_url('/'), PHP_URL_HOST);
  if (!$host) {
  return 'no-reply@example.com';
  }

  return 'no-reply@' . $host;
}

function swup_minimal_contact_from_name() {
  return wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
}

function swup_minimal_contact_format_value_for_display($key, $value) {
  $fields = swup_minimal_contact_fields();
  if (!isset($fields[$key])) {
  return is_array($value) ? implode('、', $value) : (string) $value;
  }

  $field = $fields[$key];
  $options = isset($field['options']) && is_array($field['options']) ? $field['options'] : array();
  $type = $field['input_type'] ?? 'text';

  if ($type === 'checkbox' && !empty($field['multiple'])) {
  if (!is_array($value) || empty($value)) {
  return '（未入力）';
  }
  $labels = array();
  foreach ($value as $selected) {
  $labels[] = isset($options[$selected]) ? $options[$selected] : $selected;
  }
  return implode('、', $labels);
  }

  if (($type === 'select' || $type === 'radio') && $value !== '') {
  return isset($options[$value]) ? $options[$value] : $value;
  }

  if ($type === 'checkbox') {
  return $value ? 'はい' : 'いいえ';
  }

  return $value !== '' ? $value : '（未入力）';
}

function swup_minimal_contact_get_form_data() {
  $values = isset($_SESSION['contact_form_data']) ? $_SESSION['contact_form_data'] : array();
  return wp_parse_args($values, swup_minimal_contact_default_values());
}

function swup_minimal_contact_pull_old_values() {
  $values = isset($_SESSION['contact_form_old']) ? $_SESSION['contact_form_old'] : array();
  unset($_SESSION['contact_form_old']);
  return wp_parse_args($values, swup_minimal_contact_default_values());
}

function swup_minimal_contact_get_prefill_values() {
  $old_values = swup_minimal_contact_pull_old_values();
  $has_old = false;
  foreach ($old_values as $value) {
  if ((is_array($value) && !empty($value)) || (!is_array($value) && $value !== '')) {
  $has_old = true;
  break;
  }
  }

  if ($has_old) {
  return $old_values;
  }

  $session_values = isset($_SESSION['contact_form_data']) ? $_SESSION['contact_form_data'] : array();
  return wp_parse_args($session_values, swup_minimal_contact_default_values());
}

function swup_minimal_contact_pull_errors() {
  $errors = isset($_SESSION['contact_form_errors']) ? $_SESSION['contact_form_errors'] : array();
  unset($_SESSION['contact_form_errors']);
  return is_array($errors) ? $errors : array();
}

function swup_minimal_contact_pull_confirm_errors() {
  $errors = isset($_SESSION['contact_confirm_errors']) ? $_SESSION['contact_confirm_errors'] : array();
  unset($_SESSION['contact_confirm_errors']);
  return is_array($errors) ? $errors : array();
}

function swup_minimal_contact_get_request_path() {
  $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
  $request_path = parse_url($request_uri, PHP_URL_PATH);
  return untrailingslashit((string) $request_path);
}

function swup_minimal_contact_get_route_path($route) {
  return untrailingslashit((string) wp_parse_url(home_url($route), PHP_URL_PATH));
}

function swup_minimal_contact_validate($input) {
  $errors = array();
  $fields = swup_minimal_contact_fields();

  foreach ($fields as $key => $field) {
  $value = isset($input[$key]) ? $input[$key] : '';
  $is_empty = is_array($value) ? empty($value) : ($value === '');
  if (!empty($field['required']) && $is_empty) {
  $errors[$key] = $field['label'] . 'は必須です。';
  continue;
  }

  if ($key === 'email' && $value !== '' && !is_email($value)) {
  $errors[$key] = 'メールアドレスの形式が正しくありません。';
  }

  if ($key === 'phone' && $value !== '' && !preg_match('/^[0-9+\-()\s]+$/', $value)) {
  $errors[$key] = '電話番号は半角数字と記号（+ - ( )）で入力してください。';
  }

  if (($field['input_type'] ?? '') === 'select' || ($field['input_type'] ?? '') === 'radio') {
  $options = isset($field['options']) && is_array($field['options']) ? array_keys($field['options']) : array();
  if ($value !== '' && !empty($options) && !in_array($value, $options, true)) {
  $errors[$key] = $field['label'] . 'の選択内容が正しくありません。';
  }
  }
  }

  return $errors;
}

function swup_minimal_handle_contact_confirm_route() {
  if (is_admin()) {
  return;
  }

  $request_path = swup_minimal_contact_get_request_path();
  $confirm_path = swup_minimal_contact_get_route_path('/contact/confirm/');

  if ($request_path !== $confirm_path) {
  return;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!isset($_POST['contact_form_nonce']) || !wp_verify_nonce($_POST['contact_form_nonce'], 'contact_form_submit')) {
  $_SESSION['contact_form_errors'] = array(
  'common' => '不正なリクエストです。お手数ですがもう一度お試しください。',
  );
  $_SESSION['contact_form_old'] = swup_minimal_contact_default_values();
  wp_safe_redirect(home_url('/contact/'));
  exit;
  }

  $input = swup_minimal_contact_sanitize_input($_POST);

  $errors = swup_minimal_contact_validate($input);
  if (!empty($errors)) {
  $_SESSION['contact_form_errors'] = $errors;
  $_SESSION['contact_form_old'] = $input;
  wp_safe_redirect(home_url('/contact/'));
  exit;
  }

  $_SESSION['contact_form_data'] = $input;
  unset($_SESSION['contact_form_errors'], $_SESSION['contact_form_old']);
  wp_safe_redirect(home_url('/contact/confirm/'));
  exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($_SESSION['contact_form_data'])) {
  wp_safe_redirect(home_url('/contact/'));
  exit;
  }
}
add_action('template_redirect', 'swup_minimal_handle_contact_confirm_route', 1);

function swup_minimal_handle_contact_send_route() {
  if (is_admin()) {
  return;
  }

  $request_path = swup_minimal_contact_get_request_path();
  $send_path = swup_minimal_contact_get_route_path('/contact/send/');

  if ($request_path !== $send_path) {
  return;
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  wp_safe_redirect(home_url('/contact/'));
  exit;
  }

  if (!isset($_POST['contact_send_nonce']) || !wp_verify_nonce($_POST['contact_send_nonce'], 'contact_send_submit')) {
  $_SESSION['contact_confirm_errors'] = array(
  'common' => '不正なリクエストです。もう一度ご確認ください。',
  );
  wp_safe_redirect(home_url('/contact/confirm/'));
  exit;
  }

  $data = swup_minimal_contact_get_form_data();
  $errors = swup_minimal_contact_validate($data);
  if (!empty($errors)) {
  $_SESSION['contact_form_errors'] = $errors;
  $_SESSION['contact_form_old'] = $data;
  unset($_SESSION['contact_form_data']);
  wp_safe_redirect(home_url('/contact/'));
  exit;
  }

  $admin_email = get_option('swup_minimal_contact_to_email', '');
  if (!is_email($admin_email)) {
  $admin_email = get_option('admin_email');
  }

  $subject = 'お問い合わせを受け付けました';
  $message_lines = array(
  'お問い合わせフォームから新規送信がありました。',
  '',
  );
  $message_lines = array_merge($message_lines, swup_minimal_contact_mail_detail_lines($data));
  $message = implode("\n", $message_lines);
  $headers = array(
  'Content-Type: text/plain; charset=UTF-8',
  'From: ' . swup_minimal_contact_from_name() . ' <' . swup_minimal_contact_from_email() . '>',
  );
  if (is_email($data['email'])) {
  $headers[] = 'Reply-To: ' . $data['email'];
  }

  $sent = wp_mail($admin_email, $subject, $message, $headers);

  if (!$sent) {
  $_SESSION['contact_confirm_errors'] = array(
  'common' => '送信に失敗しました。時間をおいて再度お試しください。',
  );
  wp_safe_redirect(home_url('/contact/confirm/'));
  exit;
  }

  if (is_email($data['email'])) {
  $auto_subject = '【自動返信】お問い合わせを受け付けました';
  $auto_message_lines = array(
  $data['name'] . ' 様',
  '',
  'この度はお問い合わせいただきありがとうございます。',
  '以下の内容でお問い合わせを受け付けました。',
  '内容を確認の上、担当者よりご連絡いたします。',
  '',
  '─────────────────────',
  );
  $auto_message_lines = array_merge($auto_message_lines, swup_minimal_contact_mail_detail_lines($data));
  $auto_message_lines = array_merge($auto_message_lines, array(
  '─────────────────────',
  '',
  '※このメールは自動送信です。返信はできません。',
  ));
  $auto_message = implode("\n", $auto_message_lines);
  $auto_headers = array(
  'Content-Type: text/plain; charset=UTF-8',
  'From: ' . swup_minimal_contact_from_name() . ' <' . swup_minimal_contact_from_email() . '>',
  'Reply-To: ' . $admin_email,
  );

  // 自動返信失敗はユーザー体験を優先してフォーム全体エラーにはしない
  wp_mail($data['email'], $auto_subject, $auto_message, $auto_headers);
  }

  $_SESSION['contact_completed'] = true;
  unset($_SESSION['contact_form_data'], $_SESSION['contact_form_errors'], $_SESSION['contact_form_old'], $_SESSION['contact_confirm_errors']);
  wp_safe_redirect(home_url('/contact/thanks/'));
  exit;
}
add_action('template_redirect', 'swup_minimal_handle_contact_send_route', 1);

function swup_minimal_guard_contact_thanks_route() {
  if (is_admin()) {
  return;
  }

  $request_path = swup_minimal_contact_get_request_path();
  $thanks_path = swup_minimal_contact_get_route_path('/contact/thanks/');

  if ($request_path !== $thanks_path) {
  return;
  }

  if (empty($_SESSION['contact_completed'])) {
  wp_safe_redirect(home_url('/contact/'));
  exit;
  }

  unset($_SESSION['contact_completed']);
}
add_action('template_redirect', 'swup_minimal_guard_contact_thanks_route', 1);

function swup_minimal_configure_mailpit($phpmailer) {
  $enabled = getenv('MAILPIT_ENABLED');
  if ($enabled !== '1') {
  return;
  }

  $host = getenv('MAILPIT_HOST') ? getenv('MAILPIT_HOST') : 'mailpit';
  $port = (int) (getenv('MAILPIT_PORT') ? getenv('MAILPIT_PORT') : 1025);

  $phpmailer->isSMTP();
  $phpmailer->Host = $host;
  $phpmailer->Port = $port;
  $phpmailer->SMTPAuth = false;
  $phpmailer->SMTPSecure = '';
  $phpmailer->SMTPAutoTLS = false;
}
add_action('phpmailer_init', 'swup_minimal_configure_mailpit');

function swup_minimal_mailpit_from_address($from_email) {
  if (getenv('MAILPIT_ENABLED') !== '1') {
  return $from_email;
  }

  // localhost ドメインは PHPMailer で弾かれるため、ローカル用に有効な形式へ固定
  return 'no-reply@example.test';
}
add_filter('wp_mail_from', 'swup_minimal_mailpit_from_address');

function swup_minimal_mailpit_from_name($from_name) {
  if (getenv('MAILPIT_ENABLED') !== '1') {
  return $from_name;
  }

  return wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
}
add_filter('wp_mail_from_name', 'swup_minimal_mailpit_from_name');
