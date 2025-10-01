export interface UMLClass {
  id: string
  name: string
  stereotype?: string
  attributes: UMLAttribute[]
  methods: UMLMethod[]
  position: { x: number; y: number }
}

export interface UMLAttribute {
  name: string
  type: string
  visibility: "public" | "private" | "protected" | "package"
  isStatic?: boolean
}

export interface UMLMethod {
  name: string
  returnType: string
  parameters: UMLParameter[]
  visibility: "public" | "private" | "protected" | "package"
  isStatic?: boolean
  isAbstract?: boolean
}

export interface UMLParameter {
  name: string
  type: string
}

export interface UMLRelationship {
  id: string
  sourceClassId: string
  targetClassId: string
  relationshipType: "inheritance" | "composition" | "aggregation" | "association" | "dependency" | "realization"
  sourceMultiplicity?: string
  targetMultiplicity?: string
  label?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  userId: string
  diagramData: any
  created_At: string
  updated_At: string
}

export interface Profile {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}
