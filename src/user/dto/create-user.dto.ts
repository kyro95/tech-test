import {
  IsString,
  IsEmail,
  Length,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

class CreateUserDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;
}

export default CreateUserDto;
