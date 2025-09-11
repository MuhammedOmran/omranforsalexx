-- إنشاء trigger لمزامنة الشيكات مع المعاملات النقدية
CREATE OR REPLACE TRIGGER sync_checks_with_cash_trigger
    AFTER INSERT OR UPDATE OR DELETE ON checks
    FOR EACH ROW 
    EXECUTE FUNCTION sync_check_with_cash_transaction();

-- إنشاء دالة لمزامنة الشيكات الموجودة مع المعاملات النقدية
CREATE OR REPLACE FUNCTION sync_existing_checks_with_cash()
RETURNS void AS $$
DECLARE
    check_record RECORD;
    transaction_type_val text;
BEGIN
    -- مرور عبر جميع الشيكات الموجودة
    FOR check_record IN 
        SELECT * FROM checks WHERE deleted_at IS NULL
    LOOP
        -- تحديد نوع المعاملة بناءً على نوع الشيك
        IF check_record.check_type = 'incoming' THEN
            transaction_type_val := 'income';
        ELSIF check_record.check_type = 'outgoing' THEN
            transaction_type_val := 'expense';
        ELSE
            -- إذا لم يتم تحديد النوع، اعتبره وارد افتراضياً
            transaction_type_val := 'income';
        END IF;

        -- التحقق من عدم وجود معاملة مرتبطة بهذا الشيك مسبقاً
        IF NOT EXISTS (
            SELECT 1 FROM cash_transactions 
            WHERE reference_id = check_record.id::text 
              AND reference_type = 'check_transaction'
              AND user_id = check_record.user_id
              AND deleted_at IS NULL
        ) THEN
            -- إدراج معاملة نقدية للشيك
            INSERT INTO cash_transactions (
                user_id,
                transaction_type,
                amount,
                description,
                category,
                subcategory,
                payment_method,
                reference_id,
                reference_type,
                notes,
                created_at
            ) VALUES (
                check_record.user_id,
                transaction_type_val,
                check_record.amount,
                CASE 
                    WHEN check_record.check_type = 'incoming' THEN 'شيك وارد - ' || check_record.customer_name || ' - رقم الشيك: ' || check_record.check_number
                    ELSE 'شيك صادر - ' || check_record.customer_name || ' - رقم الشيك: ' || check_record.check_number
                END,
                CASE 
                    WHEN check_record.check_type = 'incoming' THEN 'receipts'
                    ELSE 'payments'
                END,
                CASE 
                    WHEN check_record.check_type = 'incoming' THEN 'check_received'
                    ELSE 'check_issued'
                END,
                'check',
                check_record.id::text,
                'check_transaction',
                CASE 
                    WHEN check_record.check_type = 'incoming' THEN 'دخل من شيك وارد رقم ' || check_record.check_number || ' من ' || check_record.customer_name
                    ELSE 'مصروف شيك صادر رقم ' || check_record.check_number || ' لـ ' || check_record.customer_name
                END,
                check_record.created_at
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تنفيذ المزامنة للشيكات الموجودة
SELECT sync_existing_checks_with_cash();