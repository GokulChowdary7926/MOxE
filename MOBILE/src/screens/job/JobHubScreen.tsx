import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/Themed';
import { apiGet } from '../../config/api';

type Company = { id: string; name: string } | null;
type JobPosting = {
  id: string;
  title: string;
  status: string;
  location?: string | null;
  locationType?: string | null;
  company?: Company;
  companyName?: string | null;
  applicationCount?: number;
  createdAt: string;
  postedBy?: { id: string; username: string | null; displayName: string | null } | null;
};

export function JobHubScreen() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'my'>('open');

  const load = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const status = filter === 'my' ? 'ALL' : 'OPEN';
    const myOnly = filter === 'my';
    apiGet<JobPosting[]>(`job/track/jobs?status=${status}&myOnly=${myOnly}`)
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch((e) => {
        setError(e?.message ?? 'Failed to load jobs');
        setJobs([]);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Job Hub" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        <ThemedText style={styles.heading}>Job list</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'open' && styles.filterChipActive]}
            onPress={() => setFilter('open')}
          >
            <ThemedText style={filter === 'open' && styles.filterChipTextActive}>
              Open jobs
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'my' && styles.filterChipActive]}
            onPress={() => setFilter('my')}
          >
            <ThemedText style={filter === 'my' && styles.filterChipTextActive}>
              My jobs
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
        {loading && !refreshing && <ActivityIndicator style={styles.loader} />}
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        {!loading && !error && jobs.length === 0 && (
          <ThemedText secondary>No jobs found.</ThemedText>
        )}
        {!loading && !error && jobs.length > 0 && (
          <ThemedView style={styles.list}>
            {jobs.map((job) => (
              <ThemedView key={job.id} style={styles.card}>
                <ThemedText style={styles.cardTitle}>{job.title}</ThemedText>
                <ThemedText secondary style={styles.cardMeta}>
                  {job.company?.name ?? job.companyName ?? 'Company'} · {job.status}
                  {job.location ? ` · ${job.location}` : ''}
                  {job.applicationCount != null ? ` · ${job.applicationCount} apps` : ''}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  heading: { fontWeight: '600', marginBottom: 4 },
  filterRow: { flexDirection: 'row', marginBottom: 8, maxHeight: 40 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterChipTextActive: { color: '#fff' },
  loader: { marginVertical: 16 },
  error: { color: '#ef4444', marginTop: 4 },
  list: { gap: 10 },
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  cardTitle: { fontWeight: '500', marginBottom: 4 },
  cardMeta: { fontSize: 12 },
});
