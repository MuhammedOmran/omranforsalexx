-- إنشاء دالة لمزامنة الشيكات مع المعاملات النقدية
CREATE OR REPLACE FUNCTION sync_check_with_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    transaction_type_val text;
    existing_transaction_id uuid;
BEGIN
    -- تحديد نوع المعاملة بناءً على نوع الشيك
    IF NEW.check_type = 'incoming' THEN
        transaction_type_val := 'income';
    ELSIF NEW.check_type = 'outgoing' THEN
        transaction_type_val := 'expense';
    ELSE
        -- إذا لم يتم تحديد النوع، اعتبره وارد افتراضياً
        transaction_type_val := 'income';
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- إدراج معاملة نقدية جديدة عند إضافة شيك
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
            notes
        ) VALUES (
            NEW.user_id,
            transaction_type_val,
            NEW.amount,
            CASE 
                WHEN NEW.check_type = 'incoming' THEN 'شيك وارد - ' || NEW.customer_name || ' - رقم الشيك: ' || NEW.check_number
                ELSE 'شيك صادر - ' || NEW.customer_name || ' - رقم الشيك: ' || NEW.check_number
            END,
            CASE 
                WHEN NEW.check_type = 'incoming' THEN 'receipts'
                ELSE 'payments'
            END,
            CASE 
                WHEN NEW.check_type = 'incoming' THEN 'check_received'
                ELSE 'check_issued'
            END,
            'check',
            NEW.id::text,
            'check_transaction',
            CASE 
                WHEN NEW.check_type = 'incoming' THEN 'دخل من شيك وارد رقم ' || NEW.check_number || ' من ' || NEW.customer_name
                ELSE 'مصروف شيك صادر رقم ' || NEW.check_number || ' لـ ' || NEW.customer_name
            END
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- البحث عن المعاملة المرتبطة بالشيك
        SELECT id INTO existing_transaction_id
        FROM cash_transactions
        WHERE reference_id = NEW.id::text 
          AND reference_type = 'check_transaction'
          AND user_id = NEW.user_id
          AND deleted_at IS NULL;

        -- إذا وجدت المعاملة، قم بتحديثها
        IF existing_transaction_id IS NOT NULL THEN
            UPDATE cash_transactions 
            SET 
                transaction_type = transaction_type_val,
                amount = NEW.amount,
                description = CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'شيك وارد - ' || NEW.customer_name || ' - رقم الشيك: ' || NEW.check_number
                    ELSE 'شيك صادر - ' || NEW.customer_name || ' - رقم الشيك: ' || NEW.check_number
                END,
                category = CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'receipts'
                    ELSE 'payments'
                END,
                subcategory = CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'check_received'
                    ELSE 'check_issued'
                END,
                notes = CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'دخل من شيك وارد رقم ' || NEW.check_number || ' من ' || NEW.customer_name
                    ELSE 'مصروف شيك صادر رقم ' || NEW.check_number || ' لـ ' || NEW.customer_name
                END,
                updated_at = now()
            WHERE id = existing_transaction_id;
        ELSE
            -- إذا لم توجد المعاملة، أنشئ واحدة جديدة
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
                notes
            ) VALUES (
                NEW.user_id,
                transaction_type_val,
                NEW.amount,
                CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'شيك وارد - ' || NEW.customer_name || ' - رقم الشيك: ' || NEW.check_number
                    ELSE 'شيك صادر - ' || NEW.customer_name || ' - رقم الشيك: ' || NEW.check_number
                END,
                CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'receipts'
                    ELSE 'payments'
                END,
                CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'check_received'
                    ELSE 'check_issued'
                END,
                'check',
                NEW.id::text,
                'check_transaction',
                CASE 
                    WHEN NEW.check_type = 'incoming' THEN 'دخل من شيك وارد رقم ' || NEW.check_number || ' من ' || NEW.customer_name
                    ELSE 'مصروف شيك صادر رقم ' || NEW.check_number || ' لـ ' || NEW.customer_name
                END
            );
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- حذف المعاملة المرتبطة عند حذف الشيك (soft delete)
        UPDATE cash_transactions 
        SET deleted_at = now()
        WHERE reference_id = OLD.id::text 
          AND reference_type = 'check_transaction'
          AND user_id = OLD.user_id
          AND deleted_at IS NULL;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;