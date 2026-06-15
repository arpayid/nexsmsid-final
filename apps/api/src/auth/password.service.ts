import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";

@Injectable()
export class PasswordService {
  hash(value: string) {
    return bcrypt.hash(value, 12);
  }

  verify(value: string, hash: string) {
    return bcrypt.compare(value, hash);
  }
}
