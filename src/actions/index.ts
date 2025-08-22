import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';
import SERVICES from '../assets/collections/services.json';
import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key');

export const server = {
  hireService: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email(),
      message: z.string().optional(),
      serviceId: z
        .string()
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
          message: 'serviceId must be a valid number greater than 0',
        })
        .transform((val) => Number(val)),
    }),
    handler: async (input) => {
      const { serviceId, email, message } = input;

      const service = SERVICES.find((service) => service.id === serviceId);

      if (!service) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: `Service with id: ${serviceId} not found`,
        });
      }

      const templateSource = readFileSync(
        join(process.cwd(), 'src/assets/templates/hire-service.hbs'),
        'utf-8'
      );
      const template = Handlebars.compile(templateSource);
      const html = template({
        service,
        email,
        message,
      });

      const { error } = await resend.emails.send({
        /* This is just because I'm using free plan, you can setup a domain 
        on your resend account to send emails from there */
        from: 'Portfolio <onboarding@resend.dev>',
        to: [process.env.MY_EMAIL || 'test@example.com'],
        subject: 'New Service Hired!',
        html,
      });

      if (error) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return {
        message: 'Email sent successfully',
      };
    },
  }),
};
