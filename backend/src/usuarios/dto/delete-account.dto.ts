import { IsIn, IsString } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsIn(['excluir'], { message: 'Digite excluir para confirmar a exclusão da conta.' })
  confirmacao!: string;
}
