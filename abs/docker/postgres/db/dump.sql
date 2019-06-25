--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: dm_emission_transaction; Type: TYPE; Schema: public; Owner: attic
--

CREATE TYPE dm_emission_transaction AS (
	id integer,
	currency character(3),
	amount integer,
	details character varying(70)
);


ALTER TYPE dm_emission_transaction OWNER TO attic;

--
-- Name: clear(); Type: FUNCTION; Schema: public; Owner: attic
--

CREATE FUNCTION clear() RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN

DELETE FROM public.transactions CASCADE;
DELETE FROM public.accounts CASCADE;
DELETE FROM public.accounts_types CASCADE;
DELETE FROM public.companies CASCADE;
DELETE FROM public.currencies CASCADE;
DELETE FROM public.errors CASCADE;
DELETE FROM public.owners CASCADE;
DELETE FROM public.transactions_statuses CASCADE;

ALTER SEQUENCE public.accounts_acc_id_seq  MINVALUE 1 RESTART 1;
ALTER SEQUENCE public.companies_cmp_id_seq MINVALUE 1 RESTART 1; 
ALTER SEQUENCE public.errors_err_id_seq MINVALUE 1 RESTART 1;
ALTER SEQUENCE public.owners_own_id_seq MINVALUE 1 RESTART 1;
ALTER SEQUENCE public.transactions_trn_id_seq MINVALUE 1 RESTART 1;

RETURN TRUE;
END;
$$;


ALTER FUNCTION public.clear() OWNER TO attic;

--
-- Name: dm_emission_error(integer, character varying, character varying); Type: FUNCTION; Schema: public; Owner: attic
--

CREATE FUNCTION dm_emission_error(transaction_id integer, error_title character varying, error_description character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  error_id 	INTEGER;
  rec 		RECORD;
  transaction_status_approved INTEGER:=2;
  
BEGIN
	-- First check transaction status
    SELECT * INTO rec FROM public.transactions WHERE trn_id = transaction_id LIMIT 1;
    IF NOT FOUND THEN
    	RAISE EXCEPTION 'No such transaction found --> %', transaction_id;
    END IF;
    
    -- Transaction should not have any errors
    IF rec.err_id IS NOT NULL OR rec.trn_error IS NOT NULL THEN 
        	RAISE EXCEPTION 'Transaction % is already contains error %', transaction_id, rec.err_id;
    END IF;
    
    -- Transaction should not have tx_hash
    IF rec.trn_hash IS NOT NULL THEN 
        	RAISE EXCEPTION 'Transaction % is already processed and contains tx_hash %', transaction_id, rec.trn_hash;
    END IF;

    -- Transaction should have specified status
    IF rec.tst_id != transaction_status_approved THEN 
        	RAISE EXCEPTION 'Failed to set error for transaction %! is already has status %', transaction_id, rec.tst_id;
    END IF;
    
     -- Set error title to uppercase
    error_title:=trim(error_title);
    IF character_length(error_title)<1 THEN 
	    RAISE WARNING 'Empty error title! Setting default';
        error_title:='Unexpected error';
    END IF;
    error_title:=upper(error_title);
    error_description:=trim(error_description);
    
    -- Get error id
    SELECT err_id INTO error_id FROM public.errors WHERE err_title = error_title LIMIT 1;
    
    IF NOT FOUND THEN
    	INSERT INTO public.errors (err_title) VALUES (error_title) RETURNING err_id INTO error_id;
    END IF;
    
    -- Some antimagic
    IF error_id IS NULL THEN
       RAISE EXCEPTION 'Failed to update transaction % with error %', transaction_id, error_title;    
    END IF;
    
    -- Update transaction with error
    UPDATE public.transactions SET err_id = error_id, trn_error = error_description WHERE trn_id = transaction_id;
    
    RETURN error_id;
END;
$$;


ALTER FUNCTION public.dm_emission_error(transaction_id integer, error_title character varying, error_description character varying) OWNER TO attic;

--
-- Name: dm_emission_success(integer, character varying); Type: FUNCTION; Schema: public; Owner: attic
--

CREATE FUNCTION dm_emission_success(transaction_id integer, emission_hash character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec RECORD;
  tx_hash VARCHAR;
  transaction_status_approved INTEGER:=2;
BEGIN
	-- Validate tx_hash -- tx hash looks like ea8db478ad496ea5dd75e5929ab3afe267d6410e1cff51ff98e0b6205cde2c88
    tx_hash:=lower(emission_hash);
    tx_hash:=regexp_replace(tx_hash, '[^a-z0-9]', '', 'g');
    IF character_length(tx_hash)!=64 THEN 
	    RAISE WARNING 'Invalid emission hash "%"',emission_hash;
    END IF;
    
	-- First check transaction status
    SELECT * INTO rec FROM public.transactions WHERE trn_id = transaction_id LIMIT 1;
    IF NOT FOUND THEN
    	RAISE EXCEPTION 'No such transaction found --> %', transaction_id;
    END IF;
    
    -- Transaction should not have any errors
    IF rec.err_id IS NOT NULL OR rec.trn_error IS NOT NULL THEN 
        	RAISE EXCEPTION 'Transaction % is already contains error %', transaction_id, rec.err_id;
    END IF;
    
    -- Transaction should not have tx_hash
    IF rec.trn_hash IS NOT NULL THEN 
        	RAISE EXCEPTION 'Transaction % is already processed and contains tx_hash %', transaction_id, rec.trn_hash;
    END IF;

    -- Transaction should have specified status
    IF rec.tst_id != transaction_status_approved THEN 
        	RAISE EXCEPTION 'Failed to set error for transaction %! is already has status %', transaction_id, rec.tst_id;
    END IF;
    
    UPDATE public.transactions SET trn_hash = tx_hash WHERE trn_id = transaction_id;
    SELECT trn_hash INTO rec FROM public.transactions WHERE trn_id = transaction_id LIMIT 1;
    IF rec.trn_hash != tx_hash THEN 
    	RAISE EXCEPTION 'Failed to update transaction % with emission hash', transaction_id, emission_hash;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.dm_emission_success(transaction_id integer, emission_hash character varying) OWNER TO attic;

--
-- Name: dm_emission_transactions(); Type: FUNCTION; Schema: public; Owner: attic
--

CREATE FUNCTION dm_emission_transactions() RETURNS SETOF dm_emission_transaction
    LANGUAGE plpgsql
    AS $$
DECLARE
	rec RECORD;
    digital_money_act_id CONSTANT INTEGER := 3;
	digital_money_cur_code CONSTANT char(3):='UAH';
    digital_money_tst_id_approved CONSTANT INTEGER := 2;
    
    pending_tx public.dm_emission_transaction;
BEGIN

FOR rec IN 
    SELECT  
      trn.trn_id,
      trn.trn_details,
      trn.trn_value,
      cur.cur_code
    FROM public.transactions as trn
    JOIN public.accounts as acc ON (trn.acc_id = acc.acc_id)
    JOIN public.currencies as cur ON (acc.cur_id = cur.cur_id)
    WHERE 
        trn.err_id IS NULL
        AND acc.act_id = digital_money_act_id 
        AND cur.cur_code = digital_money_cur_code 
        AND trn.tst_id = digital_money_tst_id_approved
LOOP
	pending_tx.id = rec.trn_id;
	pending_tx.currency = rec.cur_code;
	pending_tx.amount = rec.trn_value;
	pending_tx.details = rec.trn_details;
	RETURN NEXT pending_tx;
END LOOP;

RETURN;

END;
$$;


ALTER FUNCTION public.dm_emission_transactions() OWNER TO attic;

--
-- Name: install(); Type: FUNCTION; Schema: public; Owner: attic
--

CREATE FUNCTION install() RETURNS boolean
    LANGUAGE plpgsql STRICT
    AS $$
DECLARE
  bank_cmp_id 		INTEGER;
  dagent_cmp_id 	INTEGER;
  bank_acc_id 		INTEGER;
  dagent_acc_id 	INTEGER;
  bay_amount		INTEGER;
  wallet_id			VARCHAR;
BEGIN

-- Create currency
IF NOT EXISTS (SELECT * FROM public.currencies WHERE cur_id  = 980) THEN 
	INSERT INTO public.currencies (cur_id,cur_code,cur_title) VALUES (980,'UAH','Украинская гривна');
END IF;

-- Create account types
IF NOT EXISTS (SELECT * FROM public.accounts_types WHERE act_id  = 1) THEN 
	INSERT INTO public.accounts_types(act_id,act_title,act_description) VALUES (1,'Personal','Персональный счет физ лица');
END IF;
IF NOT EXISTS (SELECT * FROM public.accounts_types WHERE act_id  = 2) THEN 
	INSERT INTO public.accounts_types(act_id,act_title,act_description) VALUES (2,'Corporate','Cчет юридического лица');
END IF;
IF NOT EXISTS (SELECT * FROM public.accounts_types WHERE act_id  = 3) THEN 
	INSERT INTO public.accounts_types(act_id,act_title,act_description) VALUES (3,'Сoncentration Digital Money','Котловой счет для учета электронных денег');
END IF;

-- Create companies
IF NOT EXISTS (SELECT * FROM public.companies WHERE cmp_nrid  = 37176171) THEN 
	INSERT INTO public.companies (cmp_title, cmp_nrid, cmp_phone, cmp_address, cmp_description) 
    VALUES ('ПУАТ Смартбанк,',37176171,'044 237-03-45','04114, Київ, в. Вишгородська, б. 45/2','Банк эмитент электронных денег'); 
END IF;
IF NOT EXISTS (SELECT * FROM public.companies WHERE cmp_nrid  = 3121719730) THEN 
	INSERT INTO public.companies (cmp_title, cmp_nrid, cmp_phone, cmp_address, cmp_description) 
    VALUES ('ФОП Васильчук С.В.',3121719730,'063 811-68-17','Київ, переулок. Панфиловцев 5','Агент распространения электронных денег'); 
END IF;
IF NOT EXISTS (SELECT * FROM public.companies WHERE cmp_nrid  = 4016970) THEN 
	INSERT INTO public.companies (cmp_title, cmp_nrid, cmp_phone, cmp_address, cmp_description) 
    VALUES ('ТОВ Алти Тел',4016970,'067 401-69-70','Київ, ул. Промышленная 5а','Продавец'); 
END IF;


-- Create transaction statuses
IF NOT EXISTS (SELECT * FROM public.transactions_statuses WHERE tst_id  = 1) THEN 
	INSERT INTO public.transactions_statuses (tst_id,tst_title,tst_description) VALUES (1,'Init','Новая транзакция. Ожидает проверки отдела финансового мониторинга');
END IF;
IF NOT EXISTS (SELECT * FROM public.transactions_statuses WHERE tst_id  = 2) THEN 
	INSERT INTO public.transactions_statuses (tst_id,tst_title,tst_description) VALUES (2,'Approved','Транзакция проверенная отделом финансового мониторинга');
END IF;
IF NOT EXISTS (SELECT * FROM public.transactions_statuses WHERE tst_id  = 3) THEN 
	INSERT INTO public.transactions_statuses (tst_id,tst_title,tst_description) VALUES (3,'Declined','Транзакция отклонена отделом финансового мониторинга');
END IF;
IF NOT EXISTS (SELECT * FROM public.transactions_statuses WHERE tst_id  = 4) THEN 
	INSERT INTO public.transactions_statuses (tst_id,tst_title,tst_description) VALUES (4,'Emission Validating','Транзакция находиться на обработке эмиссии');
END IF;
IF NOT EXISTS (SELECT * FROM public.transactions_statuses WHERE tst_id  = 5) THEN 
	INSERT INTO public.transactions_statuses (tst_id,tst_title,tst_description) VALUES (5,'Emission Rejected','Транзакция отклонена модулем эмиссии');
END IF;
IF NOT EXISTS (SELECT * FROM public.transactions_statuses WHERE tst_id  = 6) THEN 
	INSERT INTO public.transactions_statuses (tst_id,tst_title,tst_description) VALUES (6,'Emission Success','Транзакция успешно обработана модулем эмиссии');
END IF;


-- Create bank Сoncentration account
SELECT cmp_id INTO bank_cmp_id FROM public.companies WHERE cmp_nrid  = 37176171;
IF NOT EXISTS (SELECT * FROM public.accounts WHERE acc_num  = 26250000000000) THEN 
	INSERT INTO public.accounts (cur_id,act_id,cmp_id,acc_num,acc_value)
	VALUES (980,3,bank_cmp_id,26250000000000,0);
END IF;

-- Create account for distribution agent
SELECT cmp_id INTO dagent_cmp_id FROM public.companies WHERE cmp_nrid  = 3121719730;
IF NOT EXISTS (SELECT * FROM public.accounts WHERE acc_num  = 26001111111111) THEN 
	INSERT INTO public.accounts (cur_id,act_id,cmp_id,acc_num,acc_value)
	VALUES (980,3,dagent_cmp_id,26001111111111,1000);
END IF;

RETURN TRUE;
END;
$$;


ALTER FUNCTION public.install() OWNER TO attic;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE accounts (
    acc_id integer NOT NULL,
    cur_id smallint NOT NULL,
    act_id smallint NOT NULL,
    own_id integer,
    cmp_id integer,
    acc_num bigint NOT NULL,
    acc_value bigint DEFAULT 0 NOT NULL
);


ALTER TABLE accounts OWNER TO attic;

--
-- Name: COLUMN accounts.own_id; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN accounts.own_id IS 'Owner id. Indicate this is personal account';


--
-- Name: COLUMN accounts.cmp_id; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN accounts.cmp_id IS 'Company id. Indicate this is corporate account';


--
-- Name: COLUMN accounts.acc_value; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN accounts.acc_value IS 'Account total value';


--
-- Name: accounts_acc_id_seq; Type: SEQUENCE; Schema: public; Owner: attic
--

CREATE SEQUENCE accounts_acc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE accounts_acc_id_seq OWNER TO attic;

--
-- Name: accounts_acc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: attic
--

ALTER SEQUENCE accounts_acc_id_seq OWNED BY accounts.acc_id;


--
-- Name: accounts_types; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE accounts_types (
    act_id smallint NOT NULL,
    act_title character varying(64) NOT NULL,
    act_description character varying(128) NOT NULL
);


ALTER TABLE accounts_types OWNER TO attic;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE companies (
    cmp_id integer NOT NULL,
    cmp_title character varying(256) NOT NULL,
    cmp_nrid bigint NOT NULL,
    cmp_phone character varying(20) NOT NULL,
    cmp_address character varying(64) NOT NULL,
    cmp_description character varying(128)
);


ALTER TABLE companies OWNER TO attic;

--
-- Name: COLUMN companies.cmp_nrid; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN companies.cmp_nrid IS 'National registration identification number';


--
-- Name: companies_cmp_id_seq; Type: SEQUENCE; Schema: public; Owner: attic
--

CREATE SEQUENCE companies_cmp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE companies_cmp_id_seq OWNER TO attic;

--
-- Name: companies_cmp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: attic
--

ALTER SEQUENCE companies_cmp_id_seq OWNED BY companies.cmp_id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE currencies (
    cur_id smallint NOT NULL,
    cur_code character(3) NOT NULL,
    cur_title character varying(32) NOT NULL
);


ALTER TABLE currencies OWNER TO attic;

--
-- Name: errors; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE errors (
    err_id integer NOT NULL,
    err_title character varying(128) NOT NULL
);


ALTER TABLE errors OWNER TO attic;

--
-- Name: errors_err_id_seq; Type: SEQUENCE; Schema: public; Owner: attic
--

CREATE SEQUENCE errors_err_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE errors_err_id_seq OWNER TO attic;

--
-- Name: errors_err_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: attic
--

ALTER SEQUENCE errors_err_id_seq OWNED BY errors.err_id;


--
-- Name: owners; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE owners (
    own_id integer DEFAULT nextval(('public.owners_own_id_seq'::text)::regclass) NOT NULL,
    own_nrid bigint NOT NULL,
    own_first_name character varying(64) NOT NULL,
    own_last_name character varying(64) NOT NULL,
    own_passport character varying(64) NOT NULL
);


ALTER TABLE owners OWNER TO attic;

--
-- Name: COLUMN owners.own_nrid; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN owners.own_nrid IS 'National Identification Registration Number';


--
-- Name: owners_own_id_seq; Type: SEQUENCE; Schema: public; Owner: attic
--

CREATE SEQUENCE owners_own_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER TABLE owners_own_id_seq OWNER TO attic;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE transactions (
    trn_id bigint NOT NULL,
    acc_id integer NOT NULL,
    tst_id smallint NOT NULL,
    err_id integer,
    trn_value integer NOT NULL,
    trn_sender_acc_id integer,
    trn_sender_account_number bigint,
    trn_sender_bank_number integer,
    trn_details character varying(160) NOT NULL,
    trn_error character varying(256),
    trn_created timestamp without time zone DEFAULT now() NOT NULL,
    trn_hash character varying(255)
);


ALTER TABLE transactions OWNER TO attic;

--
-- Name: COLUMN transactions.acc_id; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.acc_id IS 'Recipient account ID';


--
-- Name: COLUMN transactions.tst_id; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.tst_id IS 'Transaction status';


--
-- Name: COLUMN transactions.err_id; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.err_id IS 'In case of failed transactions';


--
-- Name: COLUMN transactions.trn_value; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.trn_value IS 'Transaction value';


--
-- Name: COLUMN transactions.trn_sender_acc_id; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.trn_sender_acc_id IS 'Sender account id in case of internal transfers';


--
-- Name: COLUMN transactions.trn_sender_account_number; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.trn_sender_account_number IS 'Sender bank account number in case of external transactions';


--
-- Name: COLUMN transactions.trn_sender_bank_number; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.trn_sender_bank_number IS 'Sender bank account number in case of external transctions';


--
-- Name: COLUMN transactions.trn_hash; Type: COMMENT; Schema: public; Owner: attic
--

COMMENT ON COLUMN transactions.trn_hash IS 'Transaction hash from digital money system';


--
-- Name: transactions_statuses; Type: TABLE; Schema: public; Owner: attic; Tablespace: 
--

CREATE TABLE transactions_statuses (
    tst_id smallint NOT NULL,
    tst_title character varying(32) NOT NULL,
    tst_description character varying(128)
);


ALTER TABLE transactions_statuses OWNER TO attic;

--
-- Name: transactions_trn_id_seq; Type: SEQUENCE; Schema: public; Owner: attic
--

CREATE SEQUENCE transactions_trn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transactions_trn_id_seq OWNER TO attic;

--
-- Name: transactions_trn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: attic
--

ALTER SEQUENCE transactions_trn_id_seq OWNED BY transactions.trn_id;


--
-- Name: acc_id; Type: DEFAULT; Schema: public; Owner: attic
--

ALTER TABLE ONLY accounts ALTER COLUMN acc_id SET DEFAULT nextval('accounts_acc_id_seq'::regclass);


--
-- Name: cmp_id; Type: DEFAULT; Schema: public; Owner: attic
--

ALTER TABLE ONLY companies ALTER COLUMN cmp_id SET DEFAULT nextval('companies_cmp_id_seq'::regclass);


--
-- Name: err_id; Type: DEFAULT; Schema: public; Owner: attic
--

ALTER TABLE ONLY errors ALTER COLUMN err_id SET DEFAULT nextval('errors_err_id_seq'::regclass);


--
-- Name: trn_id; Type: DEFAULT; Schema: public; Owner: attic
--

ALTER TABLE ONLY transactions ALTER COLUMN trn_id SET DEFAULT nextval('transactions_trn_id_seq'::regclass);


--
-- Name: accounts_acc_num_key; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_acc_num_key UNIQUE (acc_num);


--
-- Name: accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (acc_id);


--
-- Name: accounts_types_act_title_key; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY accounts_types
    ADD CONSTRAINT accounts_types_act_title_key UNIQUE (act_title);


--
-- Name: accounts_types_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY accounts_types
    ADD CONSTRAINT accounts_types_pkey PRIMARY KEY (act_id);


--
-- Name: companies_cmp_nid_key; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY companies
    ADD CONSTRAINT companies_cmp_nid_key UNIQUE (cmp_nrid);


--
-- Name: companies_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (cmp_id);


--
-- Name: currencies_cur_code_key; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY currencies
    ADD CONSTRAINT currencies_cur_code_key UNIQUE (cur_code);


--
-- Name: currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (cur_id);


--
-- Name: errors_err_title_key; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY errors
    ADD CONSTRAINT errors_err_title_key UNIQUE (err_title);


--
-- Name: errors_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY errors
    ADD CONSTRAINT errors_pkey PRIMARY KEY (err_id);


--
-- Name: owners_own_nrid_key; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY owners
    ADD CONSTRAINT owners_own_nrid_key UNIQUE (own_nrid);


--
-- Name: owners_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY owners
    ADD CONSTRAINT owners_pkey PRIMARY KEY (own_id);


--
-- Name: transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (trn_id);


--
-- Name: transactions_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY transactions_statuses
    ADD CONSTRAINT transactions_statuses_pkey PRIMARY KEY (tst_id);


--
-- Name: transactions_statuses_tst_title_key; Type: CONSTRAINT; Schema: public; Owner: attic; Tablespace: 
--

ALTER TABLE ONLY transactions_statuses
    ADD CONSTRAINT transactions_statuses_tst_title_key UNIQUE (tst_title);


--
-- Name: accounts_idx; Type: INDEX; Schema: public; Owner: attic; Tablespace: 
--

CREATE INDEX accounts_idx ON accounts USING btree (cur_id);


--
-- Name: accounts_idx1; Type: INDEX; Schema: public; Owner: attic; Tablespace: 
--

CREATE INDEX accounts_idx1 ON accounts USING btree (act_id);


--
-- Name: accounts_idx2; Type: INDEX; Schema: public; Owner: attic; Tablespace: 
--

CREATE INDEX accounts_idx2 ON accounts USING btree (own_id);


--
-- Name: transactions_idx; Type: INDEX; Schema: public; Owner: attic; Tablespace: 
--

CREATE INDEX transactions_idx ON transactions USING btree (acc_id);


--
-- Name: transactions_idx1; Type: INDEX; Schema: public; Owner: attic; Tablespace: 
--

CREATE INDEX transactions_idx1 ON transactions USING btree (tst_id);


--
-- Name: transactions_idx2; Type: INDEX; Schema: public; Owner: attic; Tablespace: 
--

CREATE INDEX transactions_idx2 ON transactions USING btree (err_id);


--
-- Name: transactions_idx3; Type: INDEX; Schema: public; Owner: attic; Tablespace: 
--

CREATE INDEX transactions_idx3 ON transactions USING btree (trn_sender_acc_id);


--
-- Name: accounts_fk; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_fk FOREIGN KEY (cur_id) REFERENCES currencies(cur_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: accounts_fk1; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_fk1 FOREIGN KEY (act_id) REFERENCES accounts_types(act_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: accounts_fk2; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_fk2 FOREIGN KEY (own_id) REFERENCES owners(own_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: accounts_fk3; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_fk3 FOREIGN KEY (cmp_id) REFERENCES companies(cmp_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transactions_fk; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_fk FOREIGN KEY (tst_id) REFERENCES transactions_statuses(tst_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transactions_fk1; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_fk1 FOREIGN KEY (acc_id) REFERENCES accounts(acc_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transactions_fk2; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_fk2 FOREIGN KEY (err_id) REFERENCES errors(err_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transactions_fk3; Type: FK CONSTRAINT; Schema: public; Owner: attic
--

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_fk3 FOREIGN KEY (trn_sender_acc_id) REFERENCES accounts(acc_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;

SELECT install();
--
-- PostgreSQL database dump complete
--

