-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "phone" TEXT,
    "wechat" TEXT,
    "source" TEXT,
    "agent_name" TEXT,
    "agent_store" TEXT,
    "budget" TEXT,
    "preferred_units" TEXT,
    "concerns" TEXT,
    "focus_points" TEXT,
    "intention_level" TEXT,
    "summary" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "visits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "visit_time" TEXT,
    "visit_type" TEXT,
    "content" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "followups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "recommended_time" TEXT,
    "priority" TEXT,
    "key_point" TEXT,
    "script" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "followups_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raw_notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "raw_text" TEXT NOT NULL,
    "ai_result_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raw_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
