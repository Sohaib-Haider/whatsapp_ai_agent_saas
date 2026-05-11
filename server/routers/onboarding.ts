import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

/**
 * Onboarding flow for WhatsApp Business setup.
 * Step 1: Enter WhatsApp Business phone number
 * Step 2: Enter WhatsApp API credentials (Phone Number ID, Access Token, Verify Token)
 * Step 3: Enter business description and agent name
 * Step 4: Configure AI agent settings (persona, system prompt)
 */

export const onboardingRouter = router({
  /**
   * Complete onboarding in one step or retrieve current business if already onboarded.
   */
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(1, "Business name is required"),
        whatsappPhoneNumber: z.string().min(10, "Valid WhatsApp phone number required"),
        phoneNumberId: z.string().min(1, "Phone Number ID is required"),
        accessToken: z.string().min(1, "Access Token is required"),
        verifyToken: z.string().min(1, "Verify Token is required"),
        agentName: z.string().min(1, "Agent name is required"),
        agentPersona: z.string().optional(),
        systemPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create or update business
        const business = await db.createBusiness({
          userId: ctx.user.id,
          businessName: input.businessName,
          whatsappPhoneNumber: input.whatsappPhoneNumber,
          phoneNumberId: input.phoneNumberId,
          accessToken: input.accessToken,
          verifyToken: input.verifyToken,
          agentName: input.agentName,
          agentPersona: input.agentPersona,
          systemPrompt: input.systemPrompt,
        });

        return {
          success: true,
          businessId: business.id,
          message: "Business onboarding completed successfully",
        };
      } catch (error) {
        console.error("[Onboarding] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete onboarding",
        });
      }
    }),

  /**
   * Get current user's businesses.
   */
  getBusinesses: protectedProcedure.query(async ({ ctx }) => {
    try {
      const businesses = await db.getBusinessesByUserId(ctx.user.id);
      return businesses;
    } catch (error) {
      console.error("[Onboarding] Error fetching businesses:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch businesses",
      });
    }
  }),

  /**
   * Get a specific business by ID (with ownership verification).
   */
  getBusiness: protectedProcedure
    .input(z.object({ businessId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const business = await db.getBusinessById(input.businessId);
        if (!business) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Business not found",
          });
        }

        // Verify ownership
        if (business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this business",
          });
        }

        return business;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Onboarding] Error fetching business:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch business",
        });
      }
    }),

  /**
   * Update business settings.
   */
  updateBusiness: protectedProcedure
    .input(
      z.object({
        businessId: z.number(),
        businessName: z.string().optional(),
        agentName: z.string().optional(),
        agentPersona: z.string().optional(),
        systemPrompt: z.string().optional(),
        aiEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const business = await db.getBusinessById(input.businessId);
        if (!business) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Business not found",
          });
        }

        // Verify ownership
        if (business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this business",
          });
        }

        const updateData: Record<string, unknown> = {};
        if (input.businessName) updateData.businessName = input.businessName;
        if (input.agentName) updateData.agentName = input.agentName;
        if (input.agentPersona) updateData.agentPersona = input.agentPersona;
        if (input.systemPrompt) updateData.systemPrompt = input.systemPrompt;
        if (input.aiEnabled !== undefined) updateData.aiEnabled = input.aiEnabled;

        await db.updateBusiness(input.businessId, updateData);

        return {
          success: true,
          message: "Business updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Onboarding] Error updating business:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update business",
        });
      }
    }),
});
