import type { UMLClass, UMLRelationship } from "@/lib/types"

export interface GeneratedCode {
  fileName: string
  content: string
  layer: "entity" | "repository" | "service" | "controller"
}

export class SpringBootGenerator {
  private classes: UMLClass[]
  private relationships: UMLRelationship[]
  private packageName: string

  constructor(classes: UMLClass[], relationships: UMLRelationship[], packageName = "com.example.demo") {
    this.classes = classes
    this.relationships = relationships
    this.packageName = packageName
  }

  generateAll(): GeneratedCode[] {
    const generatedFiles: GeneratedCode[] = []

    // Generate entities
    this.classes.forEach((umlClass) => {
      if (umlClass.stereotype !== "interface") {
        generatedFiles.push(this.generateEntity(umlClass))
        generatedFiles.push(this.generateRepository(umlClass))
        generatedFiles.push(this.generateService(umlClass))
        generatedFiles.push(this.generateController(umlClass))
      }
    })

    return generatedFiles
  }

  private generateEntity(umlClass: UMLClass): GeneratedCode {
    const className = umlClass.name
    const imports = new Set<string>()
    imports.add("import jakarta.persistence.*")
    imports.add("import lombok.Data")
    imports.add("import lombok.NoArgsConstructor")
    imports.add("import lombok.AllArgsConstructor")

    // Check for relationships
    const classRelationships = this.relationships.filter(
      (rel) => rel.sourceClassId === umlClass.id || rel.targetClassId === umlClass.id,
    )

    if (classRelationships.length > 0) {
      imports.add("import java.util.List")
      imports.add("import java.util.ArrayList")
    }

    let classContent = `@Entity
@Table(name = "${this.toSnakeCase(className)}")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${className} {

`

    // Generate ID field
    classContent += `    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

`

    // Generate attributes
    umlClass.attributes.forEach((attr) => {
      if (attr.name !== "id") {
        const javaType = this.mapToJavaType(attr.type)
        const columnAnnotation = `@Column(name = "${this.toSnakeCase(attr.name)}")`

        classContent += `    ${columnAnnotation}
    private ${javaType} ${attr.name};

`
      }
    })

    // Generate relationship fields
    classRelationships.forEach((rel) => {
      const isSource = rel.sourceClassId === umlClass.id
      const relatedClassId = isSource ? rel.targetClassId : rel.sourceClassId
      const relatedClass = this.classes.find((c) => c.id === relatedClassId)

      if (relatedClass) {
        const relatedClassName = relatedClass.name
        const fieldName = this.toCamelCase(relatedClassName)

        switch (rel.relationshipType) {
          case "inheritance":
            // Handle inheritance with @Inheritance annotation
            break
          case "composition":
          case "aggregation":
            if (rel.targetMultiplicity === "*" || rel.targetMultiplicity === "1..*") {
              classContent += `    @OneToMany(mappedBy = "${this.toCamelCase(className)}", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<${relatedClassName}> ${fieldName}List = new ArrayList<>();

`
            } else {
              classContent += `    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "${this.toSnakeCase(relatedClassName)}_id")
    private ${relatedClassName} ${fieldName};

`
            }
            break
          case "association":
            if (rel.targetMultiplicity === "*" || rel.targetMultiplicity === "1..*") {
              classContent += `    @ManyToMany
    @JoinTable(
        name = "${this.toSnakeCase(className)}_${this.toSnakeCase(relatedClassName)}",
        joinColumns = @JoinColumn(name = "${this.toSnakeCase(className)}_id"),
        inverseJoinColumns = @JoinColumn(name = "${this.toSnakeCase(relatedClassName)}_id")
    )
    private List<${relatedClassName}> ${fieldName}List = new ArrayList<>();

`
            } else {
              classContent += `    @ManyToOne
    @JoinColumn(name = "${this.toSnakeCase(relatedClassName)}_id")
    private ${relatedClassName} ${fieldName};

`
            }
            break
        }
      }
    })

    classContent += "}"

    const importsString = Array.from(imports).join(";\n") + ";\n\n"

    return {
      fileName: `${className}.java`,
      content: `package ${this.packageName}.entity;

${importsString}${classContent}`,
      layer: "entity",
    }
  }

  private generateRepository(umlClass: UMLClass): GeneratedCode {
    const className = umlClass.name
    const repositoryName = `${className}Repository`

    const content = `package ${this.packageName}.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ${this.packageName}.entity.${className};

@Repository
public interface ${repositoryName} extends JpaRepository<${className}, Long> {
    
    // Custom query methods can be added here
    // Example: List<${className}> findByName(String name);
    
}`

    return {
      fileName: `${repositoryName}.java`,
      content,
      layer: "repository",
    }
  }

  private generateService(umlClass: UMLClass): GeneratedCode {
    const className = umlClass.name
    const serviceName = `${className}Service`
    const repositoryName = `${className}Repository`

    const content = `package ${this.packageName}.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ${this.packageName}.entity.${className};
import ${this.packageName}.repository.${repositoryName};
import java.util.List;
import java.util.Optional;

@Service
public class ${serviceName} {

    @Autowired
    private ${repositoryName} ${this.toCamelCase(repositoryName)};

    public List<${className}> findAll() {
        return ${this.toCamelCase(repositoryName)}.findAll();
    }

    public Optional<${className}> findById(Long id) {
        return ${this.toCamelCase(repositoryName)}.findById(id);
    }

    public ${className} save(${className} ${this.toCamelCase(className)}) {
        return ${this.toCamelCase(repositoryName)}.save(${this.toCamelCase(className)});
    }

    public void deleteById(Long id) {
        ${this.toCamelCase(repositoryName)}.deleteById(id);
    }

    public ${className} update(Long id, ${className} ${this.toCamelCase(className)}) {
        if (${this.toCamelCase(repositoryName)}.existsById(id)) {
            ${this.toCamelCase(className)}.setId(id);
            return ${this.toCamelCase(repositoryName)}.save(${this.toCamelCase(className)});
        }
        throw new RuntimeException("${className} not found with id: " + id);
    }
}`

    return {
      fileName: `${serviceName}.java`,
      content,
      layer: "service",
    }
  }

  private generateController(umlClass: UMLClass): GeneratedCode {
    const className = umlClass.name
    const controllerName = `${className}Controller`
    const serviceName = `${className}Service`

    const content = `package ${this.packageName}.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ${this.packageName}.entity.${className};
import ${this.packageName}.service.${serviceName};
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/${this.toCamelCase(className)}s")
@CrossOrigin(origins = "*")
public class ${controllerName} {

    @Autowired
    private ${serviceName} ${this.toCamelCase(serviceName)};

    @GetMapping
    public ResponseEntity<List<${className}>> getAll${className}s() {
        List<${className}> ${this.toCamelCase(className)}s = ${this.toCamelCase(serviceName)}.findAll();
        return ResponseEntity.ok(${this.toCamelCase(className)}s);
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> get${className}ById(@PathVariable Long id) {
        Optional<${className}> ${this.toCamelCase(className)} = ${this.toCamelCase(serviceName)}.findById(id);
        return ${this.toCamelCase(className)}.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<${className}> create${className}(@RequestBody ${className} ${this.toCamelCase(className)}) {
        ${className} saved${className} = ${this.toCamelCase(serviceName)}.save(${this.toCamelCase(className)});
        return ResponseEntity.ok(saved${className});
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update${className}(@PathVariable Long id, @RequestBody ${className} ${this.toCamelCase(className)}) {
        try {
            ${className} updated${className} = ${this.toCamelCase(serviceName)}.update(id, ${this.toCamelCase(className)});
            return ResponseEntity.ok(updated${className});
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete${className}(@PathVariable Long id) {
        ${this.toCamelCase(serviceName)}.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}`

    return {
      fileName: `${controllerName}.java`,
      content,
      layer: "controller",
    }
  }

  private mapToJavaType(umlType: string): string {
    const typeMap: Record<string, string> = {
      String: "String",
      string: "String",
      Integer: "Integer",
      int: "Integer",
      Long: "Long",
      long: "Long",
      Double: "Double",
      double: "Double",
      Float: "Float",
      float: "Float",
      Boolean: "Boolean",
      boolean: "Boolean",
      Date: "java.time.LocalDateTime",
      DateTime: "java.time.LocalDateTime",
      LocalDateTime: "java.time.LocalDateTime",
      LocalDate: "java.time.LocalDate",
      BigDecimal: "java.math.BigDecimal",
    }

    return typeMap[umlType] || umlType
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "")
  }

  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1)
  }
}
