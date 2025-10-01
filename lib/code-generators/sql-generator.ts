import type { UMLClass, UMLRelationship } from "@/lib/types"

export class SQLGenerator {
  private classes: UMLClass[]
  private relationships: UMLRelationship[]

  constructor(classes: UMLClass[], relationships: UMLRelationship[]) {
    this.classes = classes
    this.relationships = relationships
  }

  generateCreateTables(): string {
    let sql = "-- Generated SQL DDL from UML Class Diagram\n\n"

    // Generate CREATE TABLE statements
    this.classes.forEach((umlClass) => {
      if (umlClass.stereotype !== "interface") {
        sql += this.generateCreateTable(umlClass)
        sql += "\n"
      }
    })

    // Generate relationship tables for many-to-many associations
    sql += this.generateRelationshipTables()

    // Generate foreign key constraints
    sql += this.generateForeignKeyConstraints()

    return sql
  }

  private generateCreateTable(umlClass: UMLClass): string {
    const tableName = this.toSnakeCase(umlClass.name)
    let sql = `CREATE TABLE ${tableName} (\n`

    // Add ID column
    sql += "    id BIGINT PRIMARY KEY AUTO_INCREMENT,\n"

    // Add attribute columns
    umlClass.attributes.forEach((attr) => {
      if (attr.name !== "id") {
        const columnName = this.toSnakeCase(attr.name)
        const sqlType = this.mapToSQLType(attr.type)
        const nullable = attr.visibility === "private" ? "NOT NULL" : "NULL"
        sql += `    ${columnName} ${sqlType} ${nullable},\n`
      }
    })

    // Add foreign key columns for relationships
    const classRelationships = this.relationships.filter(
      (rel) => rel.sourceClassId === umlClass.id && rel.relationshipType !== "inheritance",
    )

    classRelationships.forEach((rel) => {
      const relatedClass = this.classes.find((c) => c.id === rel.targetClassId)
      if (relatedClass && rel.relationshipType !== "association") {
        const fkColumnName = `${this.toSnakeCase(relatedClass.name)}_id`
        sql += `    ${fkColumnName} BIGINT,\n`
      }
    })

    // Remove trailing comma and close table
    sql = sql.replace(/,\n$/, "\n")
    sql += ");\n"

    return sql
  }

  private generateRelationshipTables(): string {
    let sql = "-- Many-to-many relationship tables\n\n"

    const manyToManyRelationships = this.relationships.filter(
      (rel) =>
        rel.relationshipType === "association" && (rel.targetMultiplicity === "*" || rel.sourceMultiplicity === "*"),
    )

    manyToManyRelationships.forEach((rel) => {
      const sourceClass = this.classes.find((c) => c.id === rel.sourceClassId)
      const targetClass = this.classes.find((c) => c.id === rel.targetClassId)

      if (sourceClass && targetClass) {
        const tableName = `${this.toSnakeCase(sourceClass.name)}_${this.toSnakeCase(targetClass.name)}`
        const sourceFK = `${this.toSnakeCase(sourceClass.name)}_id`
        const targetFK = `${this.toSnakeCase(targetClass.name)}_id`

        sql += `CREATE TABLE ${tableName} (\n`
        sql += `    ${sourceFK} BIGINT NOT NULL,\n`
        sql += `    ${targetFK} BIGINT NOT NULL,\n`
        sql += `    PRIMARY KEY (${sourceFK}, ${targetFK}),\n`
        sql += `    FOREIGN KEY (${sourceFK}) REFERENCES ${this.toSnakeCase(sourceClass.name)}(id) ON DELETE CASCADE,\n`
        sql += `    FOREIGN KEY (${targetFK}) REFERENCES ${this.toSnakeCase(targetClass.name)}(id) ON DELETE CASCADE\n`
        sql += ");\n\n"
      }
    })

    return sql
  }

  private generateForeignKeyConstraints(): string {
    let sql = "-- Foreign key constraints\n\n"

    this.relationships.forEach((rel) => {
      if (rel.relationshipType !== "association" && rel.relationshipType !== "inheritance") {
        const sourceClass = this.classes.find((c) => c.id === rel.sourceClassId)
        const targetClass = this.classes.find((c) => c.id === rel.targetClassId)

        if (sourceClass && targetClass) {
          const sourceTable = this.toSnakeCase(sourceClass.name)
          const targetTable = this.toSnakeCase(targetClass.name)
          const fkColumn = `${targetTable}_id`
          const constraintName = `fk_${sourceTable}_${targetTable}`

          sql += `ALTER TABLE ${sourceTable} ADD CONSTRAINT ${constraintName} `
          sql += `FOREIGN KEY (${fkColumn}) REFERENCES ${targetTable}(id);\n`
        }
      }
    })

    return sql
  }

  private mapToSQLType(umlType: string): string {
    const typeMap: Record<string, string> = {
      String: "VARCHAR(255)",
      string: "VARCHAR(255)",
      Integer: "INT",
      int: "INT",
      Long: "BIGINT",
      long: "BIGINT",
      Double: "DOUBLE",
      double: "DOUBLE",
      Float: "FLOAT",
      float: "FLOAT",
      Boolean: "BOOLEAN",
      boolean: "BOOLEAN",
      Date: "DATETIME",
      DateTime: "DATETIME",
      LocalDateTime: "DATETIME",
      LocalDate: "DATE",
      BigDecimal: "DECIMAL(19,2)",
    }

    return typeMap[umlType] || "VARCHAR(255)"
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "")
  }
}
