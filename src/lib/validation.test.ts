import { describe, expect, it } from "vitest";
import { credentialsSchema, lessonSchema, registerSchema } from "./validation";
describe("validações", () => {
  it("normaliza e-mail no cadastro", () => { const value=registerSchema.parse({name:"Pessoa Teste",email:"PESSOA@EXAMPLE.COM",password:"senha-segura"}); expect(value.email).toBe("pessoa@example.com"); });
  it("rejeita senha curta", () => { expect(credentialsSchema.safeParse({email:"a@b.com",password:"123"}).success).toBe(false); });
  it("valida a estrutura de uma aula", () => { const base={slug:"golpe-pix",title:"Golpe com Pix",summary:"Resumo suficientemente longo",intro:"Introdução suficientemente longa para uma aula.",tips:["Uma dica válida"],color:"#16836F",background:"#E7F7F1",order:1}; expect(lessonSchema.safeParse(base).success).toBe(true); expect(lessonSchema.safeParse({...base,slug:"Golpe Pix"}).success).toBe(false); });
});
