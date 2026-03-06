import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Typography, Card, Button, Badge } from "@/components/ui";
import { useHealthStore } from "@/stores/healthStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import {
  VISIT_TYPE_META,
  type VisitType,
  type VetVisit,
} from "@/types/health";

/**
 * Vet Visit Tracker — PRD-05 §7
 */

export default function VetVisitsScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();

  // PRD-07: Gate premium content (inline, no redirect — prevents render loops)
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const plan = useTrainingStore((s) => s.plan);
  const dogName = dog?.name ?? plan?.dogName ?? "Your Pup";
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";

  // Stable: select raw data + memoize filter/sort
  const vetVisitEntries = useHealthStore((s) => s.vetVisits);
  const visits = useMemo(
    () => vetVisitEntries
      .filter((v) => v.dogId === dogId)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()),
    [vetVisitEntries, dogId]
  );
  const addVetVisit = useHealthStore((s) => s.addVetVisit);

  const [showForm, setShowForm] = useState(false);
  const [visitType, setVisitType] = useState<VisitType>("wellness_check");
  const [reason, setReason] = useState("");
  const [clinic, setClinic] = useState("");
  const [vetName, setVetName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState(false);

  const VISIT_TYPES = Object.entries(VISIT_TYPE_META) as [
    VisitType,
    { label: string; icon: string },
  ][];

  const resetForm = () => {
    setVisitType("wellness_check");
    setReason("");
    setClinic("");
    setVetName("");
    setDiagnosis("");
    setTreatment("");
    setCost("");
    setNotes("");
    setFollowUp(false);
    setShowForm(false);
  };

  const handleSave = useCallback(() => {
    if (!reason.trim()) {
      Alert.alert("Reason Required", "Please enter the reason for the visit.");
      return;
    }
    addVetVisit({
      dogId,
      visitType,
      visitDate: new Date().toISOString().split("T")[0]!,
      reason: reason.trim(),
      vetClinic: clinic.trim() || undefined,
      vetName: vetName.trim() || undefined,
      diagnosis: diagnosis.trim() || undefined,
      treatment: treatment.trim() || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      notes: notes.trim() || undefined,
      followUpNeeded: followUp,
    });
    resetForm();
    Alert.alert("Logged! 🏥", `Vet visit recorded. +5 XP 🎉`);
  }, [
    visitType,
    reason,
    clinic,
    vetName,
    diagnosis,
    treatment,
    cost,
    notes,
    followUp,
    dogId,
    addVetVisit,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Typography variant="h1">🏥 Vet Visits</Typography>
              <Typography variant="body" color="secondary">
                {dogName}'s veterinary history
              </Typography>
            </View>
            <Button
              label="+ Log Visit"
              variant="primary"
              size="sm"
              onPress={() => setShowForm(true)}
            />
          </View>
        </Animated.View>

        {/* Add form */}
        {showForm && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="px-xl mb-lg"
          >
            <Card className="bg-primary-extralight border border-primary/20">
              <Typography variant="h3" className="mb-base">
                Log Vet Visit
              </Typography>

              {/* Visit type */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Visit Type
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-base"
              >
                <View className="flex-row gap-sm">
                  {VISIT_TYPES.map(([key, meta]) => (
                    <Pressable
                      key={key}
                      onPress={() => setVisitType(key)}
                      className={`px-md py-sm rounded-full flex-row items-center gap-xs ${
                        visitType === key
                          ? "bg-primary"
                          : "bg-surface border border-border"
                      }`}
                    >
                      <Typography className="text-[12px]">
                        {meta.icon}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={visitType === key ? "inverse" : "secondary"}
                      >
                        {meta.label}
                      </Typography>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Reason */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Reason / Chief Concern*
              </Typography>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Annual wellness check"
                className="bg-surface border border-border rounded-xl px-base py-md mb-base text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Medium" }}
                placeholderTextColor="#9CA3AF"
              />

              {/* Clinic & Vet */}
              <View className="flex-row gap-sm mb-base">
                <View className="flex-1">
                  <Typography
                    variant="caption"
                    color="secondary"
                    className="mb-xs"
                  >
                    Clinic
                  </Typography>
                  <TextInput
                    value={clinic}
                    onChangeText={setClinic}
                    placeholder="Clinic name"
                    className="bg-surface border border-border rounded-xl px-base py-md text-[14px]"
                    style={{ fontFamily: "PlusJakartaSans-Regular" }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="flex-1">
                  <Typography
                    variant="caption"
                    color="secondary"
                    className="mb-xs"
                  >
                    Vet Name
                  </Typography>
                  <TextInput
                    value={vetName}
                    onChangeText={setVetName}
                    placeholder="Dr. Smith"
                    className="bg-surface border border-border rounded-xl px-base py-md text-[14px]"
                    style={{ fontFamily: "PlusJakartaSans-Regular" }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Diagnosis & Treatment */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Diagnosis
              </Typography>
              <TextInput
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="Optional"
                className="bg-surface border border-border rounded-xl px-base py-md mb-sm text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Regular" }}
                placeholderTextColor="#9CA3AF"
              />

              <Typography variant="caption" color="secondary" className="mb-xs">
                Treatment / Prescriptions
              </Typography>
              <TextInput
                value={treatment}
                onChangeText={setTreatment}
                placeholder="Optional"
                className="bg-surface border border-border rounded-xl px-base py-md mb-sm text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Regular" }}
                placeholderTextColor="#9CA3AF"
                multiline
              />

              {/* Cost */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Cost ($)
              </Typography>
              <TextInput
                value={cost}
                onChangeText={setCost}
                placeholder="0.00"
                keyboardType="decimal-pad"
                className="bg-surface border border-border rounded-xl px-base py-md mb-sm text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Regular" }}
                placeholderTextColor="#9CA3AF"
              />

              {/* Follow-up */}
              <View className="flex-row items-center justify-between mb-base">
                <Typography variant="body-sm">Follow-up needed?</Typography>
                <Switch
                  value={followUp}
                  onValueChange={setFollowUp}
                  trackColor={{ true: "#FF6B5C" }}
                />
              </View>

              {/* Notes */}
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes"
                className="bg-surface border border-border rounded-xl px-base py-md mb-base text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Regular" }}
                placeholderTextColor="#9CA3AF"
                multiline
              />

              {/* Actions */}
              <View className="flex-row gap-sm">
                <Pressable
                  onPress={resetForm}
                  className="flex-1 py-md items-center rounded-xl bg-surface border border-border"
                >
                  <Typography variant="body-sm-medium" color="secondary">
                    Cancel
                  </Typography>
                </Pressable>
                <View className="flex-1">
                  <Button
                    label="Save Visit"
                    variant="primary"
                    fullWidth
                    onPress={handleSave}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Visit list */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl"
        >
          {visits.length > 0 ? (
            visits.map((visit) => {
              const meta = VISIT_TYPE_META[visit.visitType];
              return (
                <Card key={visit.id} className="mb-sm">
                  <View className="flex-row items-start gap-md">
                    <Typography className="text-[24px]">
                      {meta.icon}
                    </Typography>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-sm mb-xs">
                        <Typography variant="body-medium">
                          {meta.label}
                        </Typography>
                        {visit.followUpNeeded && (
                          <Badge
                            variant="warning"
                            label="Follow-up"
                            size="sm"
                          />
                        )}
                      </View>
                      <Typography variant="body-sm" className="mb-xs">
                        {visit.reason}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {new Date(visit.visitDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {visit.vetClinic ? ` · ${visit.vetClinic}` : ""}
                        {visit.cost != null ? ` · $${visit.cost}` : ""}
                      </Typography>
                      {visit.diagnosis && (
                        <Typography
                          variant="caption"
                          color="secondary"
                          className="mt-xs"
                        >
                          Dx: {visit.diagnosis}
                        </Typography>
                      )}
                      {visit.treatment && (
                        <Typography
                          variant="caption"
                          color="secondary"
                          className="mt-xs"
                        >
                          Tx: {visit.treatment}
                        </Typography>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })
          ) : (
            !showForm && (
              <Card className="items-center py-xl">
                <Typography className="text-[40px] mb-sm">🏥</Typography>
                <Typography variant="body-medium" className="mb-xs">
                  No vet visits logged
                </Typography>
                <Typography
                  variant="body-sm"
                  color="secondary"
                  className="text-center mb-base"
                >
                  Log wellness checks, vaccinations, emergencies, and more.
                </Typography>
                <Button
                  label="Log First Visit"
                  variant="primary"
                  onPress={() => setShowForm(true)}
                />
              </Card>
            )
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
