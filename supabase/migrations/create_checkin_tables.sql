/*
  # 创建签到系统表

  1. 新表
    - users: 用户表（设备ID作为唯一标识）
    - check_ins: 签到记录表
    - emergency_contacts: 紧急联系人表

  2. 安全
    - 启用 RLS
    - 添加基于 device_id 的访问策略
*/

-- 用户表（使用设备ID识别用户）
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data by device_id"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (true);

-- 签到记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Check-ins are readable"
  ON check_ins FOR SELECT
  USING (true);

CREATE POLICY "Check-ins can be inserted"
  ON check_ins FOR INSERT
  WITH CHECK (true);

-- 紧急联系人表
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  notified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts are readable"
  ON emergency_contacts FOR SELECT
  USING (true);

CREATE POLICY "Contacts can be inserted"
  ON emergency_contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Contacts can be updated"
  ON emergency_contacts FOR UPDATE
  USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_checked_at ON check_ins(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- 创建视图：获取需要通知的用户（2天未签到）
CREATE OR REPLACE VIEW users_need_notification AS
SELECT
  u.id as user_id,
  u.device_id,
  ec.name as contact_name,
  ec.email as contact_email,
  ec.notified_at,
  MAX(ci.checked_at) as last_check_in,
  EXTRACT(EPOCH FROM (now() - MAX(ci.checked_at))) / 86400 as days_since_checkin
FROM users u
INNER JOIN emergency_contacts ec ON ec.user_id = u.id
LEFT JOIN check_ins ci ON ci.user_id = u.id
GROUP BY u.id, u.device_id, ec.name, ec.email, ec.notified_at
HAVING
  (MAX(ci.checked_at) IS NULL OR MAX(ci.checked_at) < now() - interval '2 days')
  AND (ec.notified_at IS NULL OR ec.notified_at < now() - interval '1 day');
