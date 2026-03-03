<?php
/**
 * Template Name: Contact Confirm
 */
get_header();
$contact_data = function_exists('swup_minimal_contact_get_form_data') ? swup_minimal_contact_get_form_data() : array();
$contact_confirm_errors = function_exists('swup_minimal_contact_pull_confirm_errors') ? swup_minimal_contact_pull_confirm_errors() : array();
$contact_fields = function_exists('swup_minimal_contact_fields') ? swup_minimal_contact_fields() : array();
?>
<main id="swup" class="swup-transition">
  <p><a href="<?php echo esc_url(home_url('/contact/')); ?>">入力ページへ戻る</a></p>
  <h1>お問い合わせ内容の確認</h1>
  <p>以下の内容で送信してよろしいですか？</p>

  <?php if (!empty($contact_confirm_errors)) : ?>
    <div class="contact-errors" role="alert" aria-live="polite">
      <p>送信できませんでした。入力内容をご確認ください。</p>
      <ul>
        <?php foreach ($contact_confirm_errors as $contact_confirm_error) : ?>
          <li><?php echo esc_html($contact_confirm_error); ?></li>
        <?php endforeach; ?>
      </ul>
    </div>
  <?php endif; ?>

  <dl>
    <?php foreach ($contact_fields as $field_key => $field) : ?>
      <?php $value = isset($contact_data[$field_key]) ? $contact_data[$field_key] : ''; ?>
      <?php
      $display_value = function_exists('swup_minimal_contact_format_value_for_display')
        ? swup_minimal_contact_format_value_for_display($field_key, $value)
        : (is_array($value) ? implode('、', $value) : $value);
      ?>
      <dt><?php echo esc_html($field['label']); ?></dt>
      <dd>
        <?php if (($field['input_type'] ?? '') === 'textarea') : ?>
          <?php echo nl2br(esc_html($display_value)); ?>
        <?php else : ?>
          <?php echo esc_html($display_value); ?>
        <?php endif; ?>
      </dd>
    <?php endforeach; ?>
  </dl>

  <form method="post" action="<?php echo esc_url(home_url('/contact/send/')); ?>">
    <?php wp_nonce_field('contact_send_submit', 'contact_send_nonce'); ?>
    <p>
      <button type="submit">この内容で送信する</button>
    </p>
  </form>
</main>
<?php get_footer(); ?>
