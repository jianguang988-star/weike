-- CreateTable
CREATE TABLE "sales_materials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "material_type" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "content_text" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_type" TEXT,
    "file_size" INTEGER,
    "cover_url" TEXT,
    "project_name" TEXT,
    "region_name" TEXT,
    "competitor_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "material_tag_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "material_tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "material_tags_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "material_tag_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales_material_tag_relations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "material_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_material_tag_relations_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "sales_materials" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_material_tag_relations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "material_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_sales_contexts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "current_project_name" TEXT,
    "compared_project_name" TEXT,
    "compared_region_name" TEXT,
    "primary_resistance_code" TEXT,
    "secondary_resistance_csv" TEXT,
    "current_scene_code" TEXT,
    "follow_goal_code" TEXT,
    "customer_budget" TEXT,
    "customer_focus" TEXT,
    "latest_follow_note" TEXT,
    "updated_by" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "customer_sales_contexts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "material_recommendations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "recommendation_type" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" TEXT,
    "used_status" TEXT NOT NULL DEFAULT 'pending',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "material_recommendations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "material_recommendations_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "sales_materials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales_response_drafts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "source_material_ids" TEXT,
    "response_text" TEXT NOT NULL,
    "strategy_text" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_response_drafts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "material_tag_categories_code_key" ON "material_tag_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "material_tags_category_id_code_key" ON "material_tags"("category_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_material_tag_relations_material_id_tag_id_key" ON "sales_material_tag_relations"("material_id", "tag_id");
