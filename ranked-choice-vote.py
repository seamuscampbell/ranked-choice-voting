"""
Ranked Choice Voting by Seamus Campbell (seamus@seamuscampbell.nyc) with assistance from ChatGPT
Converted from PHP to Python (Modern Python 3.x with type hints) via Warp
"""

from typing import List, Dict, Optional


class RankedChoiceVote:
    """
    Algorithm methodology:
        Put all candidates into a 2-dimensional array with the first dimension being the individual ballot and the second dimension being the order
        After each round, see who has the most votes at the front of their rankings
        If a candidate passes the win number (simple majority), remove them from contention
        If the number of spots for winning candidates is full, stop
        Otherwise, order the rankings and find the candidate with the fewest number of votes, BUT if there is a "protected candidate" (e.g., "No Endorsement"), find the candidate with the second-fewest votes
        Remove the found candidate from all of the ballots (i.e,. every candidate goes up one rank)
        Continue the process until the number of winners or the number of remaining candidates equals the maximum number of winners
    """

    def __init__(self, votes: List[List[str]], protected_candidate: str, election_name: str, num_of_winners: int):
        """
        Constructor function
        
        Args:
            votes: 2-dimensional list of all votes
            protected_candidate: a candidate that cannot be eliminated between rounds
            election_name: name of office being sought
            num_of_winners: number of people who can be elected
        """
        if not isinstance(votes, list):
            raise TypeError(f"Parameter 1 (votes array) is not of type list; {type(votes)} given")
        if not isinstance(protected_candidate, str):
            raise TypeError(f"Parameter 2 (protected candidate) is not of type str; {type(protected_candidate)} given")
        if not isinstance(election_name, str):
            raise TypeError(f"Parameter 3 (election name) is not of type str; {type(election_name)} given")
        if not isinstance(num_of_winners, int):
            raise TypeError(f"Parameter 4 (number of winners) is not of type int; {type(num_of_winners)} given")
        
        self._votes = votes  # input list of the votes
        self._protected_candidate = protected_candidate  # candidate that cannot be eliminated between rounds
        self._rounds = 1  # counter for the number of rounds it has taken to run
        self._election_name = election_name  # name of office being sought
        self._num_of_winners = num_of_winners  # number of people who can win
        self._winner_exists = False  # boolean for if a winner has been found
        self._winner_name: List[str] = []  # list storing the name(s) of the winner(s)
        self._num_of_spots_to_fill = num_of_winners  # number of remaining spots

    def get_winner_exists(self) -> bool:
        """Function for telling if there is a winner"""
        return self._winner_exists

    def get_election_name(self) -> str:
        """Function to get the office being sought"""
        return self._election_name

    def get_num_of_winners(self) -> int:
        """Function to get the number of winners"""
        return self._num_of_winners

    def get_winner(self) -> List[str]:
        """Function for outputting the winner list"""
        return self._winner_name

    def get_number_of_confirmed_winners(self) -> int:
        """Function to output the number of winners in the list"""
        return len(self.get_winner())

    def get_candidate_list(self, array: List) -> List[str]:
        """Function for outputting a list of all of the candidates"""
        unique_values = []
        for value in array:
            if isinstance(value, list):
                # If the element is a list, recursively call the function
                unique_values.extend(self.get_candidate_list(value))
            elif value not in unique_values:
                # If the element is not already in the unique values list, add it
                unique_values.append(value)
        return unique_values

    def _count_first_choices(self, array: List[List[str]]) -> Dict[str, int]:
        """Function to count first-choice votes"""
        vote_count = {}
        first_column = self._get_first_item_in_each_dimension(array)

        for candidate in first_column:
            if candidate not in vote_count:
                vote_count[candidate] = 1
            else:
                vote_count[candidate] += 1

        # sort by votes, highest first
        return dict(sorted(vote_count.items(), key=lambda x: x[1], reverse=True))

    def _remove_blank_arrays(self, array: List[List[str]]) -> None:
        """Function to remove spoiled ballots"""
        temp_array = [sub_array for sub_array in array if sub_array]
        self._votes = temp_array

    def _get_num_of_ballots(self) -> int:
        """Function for getting the number of people who voted"""
        return len(self._votes)

    def _is_even(self, number: int) -> bool:
        """Function to help determine win number"""
        return number % 2 == 0

    def get_win_number(self) -> int:
        """Function for getting the win number (simple majority)"""
        num_of_ballots = self._get_num_of_ballots()
        if self._is_even(num_of_ballots):
            win_number = num_of_ballots // 2 + 1
        else:
            win_number = (num_of_ballots + 1) // 2
        return win_number

    def _get_candidate_with_fewest(self, array: List[List[str]], skip: str) -> str:
        """Function to search through the first item in each ballot and find the person who got the fewest votes"""
        vote_count = self._count_first_choices(array)  # descending
        candidates = list(vote_count.keys())
        fewest = candidates[-1] if candidates else ""  # since descending, this is the fewest

        if fewest == skip and len(candidates) > 1:
            fewest = candidates[-2]  # get second to last

        self._print_tally(vote_count)
        return fewest

    def _get_candidate_with_most(self, array: List[List[str]]) -> str:
        """Function to search through the first item in each ballot and find the person who got the most votes"""
        vote_count = self._count_first_choices(array)
        candidates = list(vote_count.keys())
        return candidates[0] if candidates else ""  # since descending, this is the most

    def _get_num_of_candidates_in_round(self, array: List[List[str]]) -> int:
        """Function to see if there are two candidates running in this round"""
        return len(self._count_first_choices(array))

    def _get_key_of_second_to_last_item(self, array: Dict[str, int]) -> Optional[str]:
        """If there is a candidate that cannot be removed, get the candidate with the second-fewest number of votes"""
        keys = list(array.keys())
        if len(keys) >= 2:
            return keys[-2]
        else:
            return None  # Return None if there are fewer than two elements in the array

    def _print_tally(self, array: Dict[str, int]) -> None:
        """Function for seeing how many votes each person got in that round"""
        for key, value in array.items():
            print(f"{key}: {value} votes")

    def _remove_candidate(self, array: List[List[str]], search: str) -> None:
        """Function to remove the person from the entire array"""
        for ballot in array:
            while search in ballot:
                ballot.remove(search)

    def _get_first_item_in_each_dimension(self, array: List[List[str]]) -> List[str]:
        """Function for getting the first item in the first dimension of each element of the array"""
        first_items = []
        for sub_array in array:
            if isinstance(sub_array, list) and len(sub_array) > 0:
                first_items.append(sub_array[0])
        return first_items

    def _add_winner(self, winner: str) -> None:
        """Function for adding a winner to the winner array"""
        self._winner_name.append(winner)

    def _find_unique_votes_left(self) -> List[str]:
        """Function to get the list of candidates left"""
        flattened_array = []
        for ballot in self._votes:
            flattened_array.extend(ballot)
        unique_items = list(set(flattened_array))
        return unique_items

    def _find_num_of_unique_votes_left(self) -> int:
        """Function to get the number of candidates left in the race"""
        unique_items = self._find_unique_votes_left()
        return len(unique_items)

    def _get_number_of_spots_to_fill(self) -> int:
        """Function to get the number of spots left"""
        return self._num_of_spots_to_fill

    def _reduce_number_of_remaining_spots_by_one(self) -> None:
        """Function to reduce the number of spots left by 1"""
        self._num_of_spots_to_fill -= 1

    def _final_candidates_round(self, array: List[List[str]]) -> str:
        """Function for if we are in the last round before figuring out who won"""
        vote_count = self._count_first_choices(array)
        self._print_tally(vote_count)
        candidates = list(vote_count.keys())
        return candidates[-1] if candidates else ""  # fewest (loser)

    def _conduct_round(self) -> None:
        """Function for determining who got the fewest votes and removing them from all ballots"""
        if self._get_num_of_candidates_in_round(self._votes) == 2:
            candidate_to_remove = self._get_candidate_with_fewest(self._votes, "Name of a candidate that does not exist")
            candidate_that_won_round = self._get_candidate_with_most(self._votes)
            self._add_winner(candidate_that_won_round)
            self._reduce_number_of_remaining_spots_by_one()
            print(f"{candidate_to_remove} was eliminated")
            print(f"{candidate_that_won_round} won round\n")
        else:
            candidate_to_remove = self._get_candidate_with_fewest(self._votes, self._protected_candidate)
            print(f"{candidate_to_remove} was eliminated\n")
        
        self._remove_candidate(self._votes, candidate_to_remove)

    def _increase_round(self) -> None:
        """Function to increment the number of rounds"""
        self._rounds += 1

    def _num_of_candidates_left(self) -> int:
        """Function for getting the number of candidates that have yet to be eliminated"""
        candidate_list = self._find_unique_votes_left()
        return len(candidate_list)

    def _see_if_top_vote_getter_is_over_win_num(self, array: List[List[str]]) -> List[str]:
        """Function to see if the top vote-getter is over the threshold of votes"""
        winners = []
        vote_count = self._count_first_choices(array)

        for candidate, votes in vote_count.items():
            if votes >= self.get_win_number():
                winners.append(candidate)

        if winners:
            self._print_tally(vote_count)

        return winners

    def _protected_candidate_in_last_at_end(self, array: List[List[str]]) -> bool:
        """Function to handle the situation where, in the end, the protected candidate is in last place"""
        if (self._num_of_candidates_left() == self._get_number_of_spots_to_fill() + 1 and 
            self._num_of_winners > 1):
            vote_count = self._count_first_choices(array)
            self._print_tally(vote_count)

            candidates = list(vote_count.keys())
            fewest = candidates[-1] if candidates else ""
            return fewest == self._protected_candidate
        return False

    def conduct_election(self) -> None:
        """Function for conducting the election"""
        print(f"## {self._election_name}")
        print(f"## Number of winners: {self.get_num_of_winners()}")
        print(f"## Win Number: {self.get_win_number()}\n")
        
        while self._get_number_of_spots_to_fill() > 0:
            print(f"### Round {self._rounds}")
            print(f"Number of candidates left: {self._find_num_of_unique_votes_left()}")
            
            candidates_over_threshold = self._see_if_top_vote_getter_is_over_win_num(self._votes)
            
            # if a candidate is over the win number, remove from the list
            if len(candidates_over_threshold) > 0:
                for candidate in candidates_over_threshold:
                    self._add_winner(candidate)
                    self._remove_candidate(self._votes, candidate)
                    self._reduce_number_of_remaining_spots_by_one()
                    print(f"{candidate} has passed the threshold of {self.get_win_number()} votes and will be removed from contention")
                    print(f"Spots remaining: {self._get_number_of_spots_to_fill()}\n")
            
            # handle special case where the protected candidate is in last
            elif self._protected_candidate_in_last_at_end(self._votes):
                print(f"{self._protected_candidate} is in last place and will be removed from contention\n")
                self._remove_candidate(self._votes, self._protected_candidate)
            
            # if we're down to the final candidates, find the one with the higher of the two
            elif self._num_of_candidates_left() - 1 == self._get_number_of_spots_to_fill():
                winner = self._final_candidates_round(self._votes)
                self._add_winner(winner)
                self._remove_candidate(self._votes, winner)
                self._reduce_number_of_remaining_spots_by_one()
                print(f"{winner} wins last round and is a winner")
            else:
                self._conduct_round()
            
            self._remove_blank_arrays(self._votes)
            self._increase_round()
        
        if self._get_number_of_spots_to_fill() == 0:
            self._winner_exists = True
            winner_list = self.get_winner()
            
            if len(winner_list) == 1:
                print(f"**{winner_list[0]} is elected as {self.get_election_name()}**")
            else:
                if len(winner_list) > 1:
                    winners_str = ", ".join(winner_list[:-1]) + f", {winner_list[-1]}"
                else:
                    winners_str = winner_list[0]
                print(f"**{winners_str} are elected as {self.get_election_name()}**")
