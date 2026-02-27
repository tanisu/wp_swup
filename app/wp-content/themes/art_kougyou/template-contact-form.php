<?php
/**
 * Template Name: Contact Form
 */
get_header();
$contact_errors = function_exists('swup_minimal_contact_pull_errors') ? swup_minimal_contact_pull_errors() : array();
$contact_old = function_exists('swup_minimal_contact_pull_old_values') ? swup_minimal_contact_pull_old_values() : array();
$contact_fields = function_exists('swup_minimal_contact_fields') ? swup_minimal_contact_fields() : array();
?>
<main id="swup" class="swup-transition">
    <p><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></p>
    <h1>お問い合わせ</h1>
    <p>以下のフォームに必要事項をご入力ください。</p>

    <?php if (!empty($contact_errors)) : ?>
        <div class="contact-errors" role="alert" aria-live="polite">
            <p>入力内容をご確認ください。</p>
            <ul>
                <?php foreach ($contact_errors as $contact_error) : ?>
                    <li><?php echo esc_html($contact_error); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <form method="post" action="<?php echo esc_url(home_url('/contact/confirm/')); ?>" novalidate>
        <?php wp_nonce_field('contact_form_submit', 'contact_form_nonce'); ?>
        <?php foreach ($contact_fields as $field_key => $field) : ?>
            <?php
            $required = !empty($field['required']);
            $value = isset($contact_old[$field_key]) ? $contact_old[$field_key] : '';
            $field_id = 'contact_' . $field_key;
            $input_type = isset($field['input_type']) ? $field['input_type'] : 'text';
            ?>
            <p>
                <label for="<?php echo esc_attr($field_id); ?>">
                    <?php echo esc_html($field['label']); ?>
                    <span><?php echo $required ? '（必須）' : '（任意）'; ?></span>
                </label><br>
                <?php if ($input_type === 'textarea') : ?>
                    <textarea
                        id="<?php echo esc_attr($field_id); ?>"
                        name="<?php echo esc_attr($field_key); ?>"
                        rows="<?php echo esc_attr(isset($field['rows']) ? (int) $field['rows'] : 6); ?>"
                        <?php echo $required ? 'required' : ''; ?>
                    ><?php echo esc_textarea($value); ?></textarea>
                <?php else : ?>
                    <input
                        id="<?php echo esc_attr($field_id); ?>"
                        name="<?php echo esc_attr($field_key); ?>"
                        type="<?php echo esc_attr($input_type); ?>"
                        autocomplete="<?php echo esc_attr(isset($field['autocomplete']) ? $field['autocomplete'] : 'off'); ?>"
                        value="<?php echo esc_attr($value); ?>"
                        <?php if (!empty($field['placeholder'])) : ?>
                            placeholder="<?php echo esc_attr($field['placeholder']); ?>"
                        <?php endif; ?>
                        <?php echo $required ? 'required' : ''; ?>
                    >
                <?php endif; ?>
            </p>
        <?php endforeach; ?>

        <p>
            <button type="submit">確認ページへ</button>
        </p>
    </form>
</main>
<?php get_footer(); ?>
