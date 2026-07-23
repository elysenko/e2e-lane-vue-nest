import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

/**
 * Validated by the global ValidationPipe ({ whitelist: true }).
 * - `title` must be a non-empty string.
 * - `url` must be a non-empty, well-formed http/https URL. Blank, malformed
 *   (`not-a-url`) and non-http(s) schemes (`javascript:`, `ftp://`) are rejected.
 * Any extra properties (e.g. `isAdmin`) are stripped by the whitelist.
 */
export class CreateBookmarkDto {
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title should not be empty' })
  title!: string;

  @IsString({ message: 'url must be a string' })
  @IsNotEmpty({ message: 'url should not be empty' })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'url must be a valid http or https URL' },
  )
  url!: string;
}
