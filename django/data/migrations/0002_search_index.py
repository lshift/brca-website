from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('data', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL("""
    ALTER TABLE variant ADD COLUMN fts_document TSVECTOR;
    ALTER TABLE variant ADD COLUMN fts_standard TSVECTOR;

    CREATE FUNCTION variant_fts_standard(v variant) RETURNS tsvector AS $$
        DECLARE
            fts_standard TEXT;
        BEGIN
            SELECT concat_ws(' ',
                v."Locus",
                v."Transcript",
                v."Allele",
                v."DNA",
                v."AA",
                v."Genome_Build",
                v."Chromosome",
                v."Genome_Build_DNA",
                v."Report_As_Allele",
                v."Report_As_DNA",
                v."Report_As_AA",
                v."Region",
                v."Cat_Dis",
                v."Non_inc_Dis",
                v."Rpt",
                v."Fam",
                v."DNA_Type",
                v."AA_Type",
                v."Cyto_Type",
                v."RS",
                v."ClinVar",
                v."Source",
                v."Alias_es",
                v."Ref")
    INTO fts_standard;
            RETURN to_tsvector('pg_catalog.simple', fts_standard);
    END;
    $$ LANGUAGE plpgsql;

    CREATE FUNCTION variant_fts_document(v variant) RETURNS tsvector AS $$
        BEGIN
            RETURN variant_fts_standard(v);
        END;
        $$ LANGUAGE plpgsql;

    CREATE FUNCTION variant_fts_trigger() RETURNS TRIGGER AS $$
    BEGIN
    NEW.fts_document=variant_fts_document(NEW);
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER variant_fts_update_trigger BEFORE UPDATE ON variant FOR EACH ROW EXECUTE PROCEDURE variant_fts_trigger();
    CREATE TRIGGER variant_fts_insert_trigger BEFORE INSERT ON variant FOR EACH ROW EXECUTE PROCEDURE variant_fts_trigger();

    CREATE INDEX variant_fts_document_index ON variant USING gin(fts_document);

    """)

    ]
